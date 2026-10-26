/**
 * A `debug_traceTransaction` JS tracer that reads the selfdestruct payload off
 * the opcode itself: the executing account, the beneficiary from the stack and
 * the balance.
 *
 * It also records the balance at the preceding balance-preserving step of the
 * same frame, which stays valid whether a client invokes `step` before or after
 * executing an opcode, including when the selfdestruct burns the balance.
 * `enter`/`exit` carry the call path, so each event binds to exactly one frame,
 * and the reported block and transaction hashes bind the answer to the block
 * being acquired.
 */
export const SELFDESTRUCT_TRACER = `{
    evs: [],
    frames: [{}],
    step: function(log, db) {
        var op = log.op.toNumber();
        var address = log.contract.getAddress();
        var account = toHex(address);
        var frame = this.frames[this.frames.length - 1];
        if (op === 255) {
            var h = log.stack.peek(0).toString(16);
            while (h.length < 40) h = "0" + h;
            var event = {
                t: "sd", from: account, to: "0x" + h.slice(-40),
                bal: "0x" + db.getBalance(address).toString(16)
            };
            if (frame.account === account && frame.balance != null) {
                event.preBalance = frame.balance;
            }
            this.evs.push(event);
            frame.balance = null;
        } else {
            frame.account = account;
            // Opcodes up to LOG4 cannot change this balance; calls, creates and
            // newer opcode families invalidate the snapshot.
            frame.balance = op <= 164
                ? "0x" + db.getBalance(address).toString(16)
                : null;
        }
    },
    enter: function(f) {
        this.frames.push({});
        this.evs.push({t: "enter"});
    },
    exit: function(r) {
        if (this.frames.length > 1) this.frames.pop();
        this.evs.push({t: "exit"});
    },
    fault: function(log, db) {
        this.frames[this.frames.length - 1].balance = null;
        this.evs.push({t: "fault"});
    },
    result: function(ctx, db) {
        return {
            evs: this.evs,
            blockHash: ctx.blockHash ? toHex(ctx.blockHash) : null,
            txHash: ctx.txHash ? toHex(ctx.txHash) : null
        };
    }
}`
