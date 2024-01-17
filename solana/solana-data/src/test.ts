import assert from 'assert'
import {describe, it} from 'node:test'
import {LogParser} from './normalization/log-parser'


describe('log parser', function() {
    it('real failed tx case', function() {
        let parser = new LogParser([
            "Program ComputeBudget111111111111111111111111111111 invoke [1]",
            "Program ComputeBudget111111111111111111111111111111 success",
            "Program GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi invoke [1]",
            "Program log: Xa nhau lau nay em quen ai chua. Co ai yeu em nhu anh khi xua ???",
            "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [2]",
            "Program log: ray_log: AwBlzR0AAAAAAAAAAAAAAAABAAAAAAAAAEu/2B0AAAAAbe4RB0RRBgBRRjF0EgAAABefogAdCgAA",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 341802 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 334250 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 119245 of 448044 compute units",
            "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success",
            "Program 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP invoke [2]",
            "Program log: Instruction: Swap",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 280381 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
            "Program log: Instruction: MintTo",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 244311 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
            "Program log: Instruction: Transfer",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 236861 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP consumed 67095 of 298680 compute units",
            "Program 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP success",
            "Program log: panicked at 'Dau vi nhau vay la qua du roi. Dung tim nhau nua !!!', src\\processor.rs:79:13",
            "Program GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi consumed 271089 of 500000 compute units",
            "Program failed to complete: BPF program panicked",
            "Program GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi failed: Program failed to complete"
        ])
        assert.strictEqual(parser.getError(), undefined)
        assert.deepStrictEqual(parser.getResult(), [
            {
                kind: 'instruction',
                programId: 'ComputeBudget111111111111111111111111111111',
                stackHeight: 1,
                success: true,
                log: []
            },
            {
                kind: 'instruction',
                programId: 'GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi',
                stackHeight: 1,
                success: false,
                error: 'Program failed to complete',
                log: [
                    {
                        kind: 'log',
                        message: 'Xa nhau lau nay em quen ai chua. Co ai yeu em nhu anh khi xua ???'
                    },
                    {
                        kind: 'instruction',
                        programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                        stackHeight: 2,
                        success: true,
                        log: [
                            {
                                kind: 'log',
                                message: 'ray_log: AwBlzR0AAAAAAAAAAAAAAAABAAAAAAAAAEu/2B0AAAAAbe4RB0RRBgBRRjF0EgAAABefogAdCgAA'
                            },
                            {
                                kind: 'instruction',
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                stackHeight: 3,
                                success: true,
                                log: [
                                    {kind: 'log', message: 'Instruction: Transfer'},
                                    {
                                        kind: 'cu',
                                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                        available: 341802n,
                                        consumed: 4645n
                                    }
                                ]
                            },
                            {
                                kind: 'instruction',
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                stackHeight: 3,
                                success: true,
                                log: [
                                    {kind: 'log', message: 'Instruction: Transfer'},
                                    {
                                        kind: 'cu',
                                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                        available: 334250n,
                                        consumed: 4645n
                                    }
                                ]
                            },
                            {
                                kind: 'cu',
                                programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                                available: 448044n,
                                consumed: 119245n
                            }
                        ]
                    },
                    {
                        kind: 'instruction',
                        programId: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
                        stackHeight: 2,
                        success: true,
                        log: [
                            {kind: 'log', message: 'Instruction: Swap'},
                            {
                                kind: 'instruction',
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                stackHeight: 3,
                                success: true,
                                log: [
                                    {kind: 'log', message: 'Instruction: Transfer'},
                                    {
                                        kind: 'cu',
                                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                        available: 280381n,
                                        consumed: 4645n
                                    }
                                ]
                            },
                            {
                                kind: 'instruction',
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                stackHeight: 3,
                                success: true,
                                log: [
                                    {kind: 'log', message: 'Instruction: MintTo'},
                                    {
                                        kind: 'cu',
                                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                        available: 244311n,
                                        consumed: 4492n
                                    }
                                ]
                            },
                            {
                                kind: 'instruction',
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                stackHeight: 3,
                                success: true,
                                log: [
                                    {kind: 'log', message: 'Instruction: Transfer'},
                                    {
                                        kind: 'cu',
                                        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                        available: 236861n,
                                        consumed: 4645n
                                    }
                                ]
                            },
                            {
                                kind: 'cu',
                                programId: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
                                available: 298680n,
                                consumed: 67095n
                            }
                        ]
                    },
                    {
                        kind: 'log',
                        message: 'panicked at \'Dau vi nhau vay la qua du roi. Dung tim nhau nua !!!\', src\\processor.rs:79:13'
                    },
                    {
                        kind: 'cu',
                        programId: 'GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi',
                        available: 500000n,
                        consumed: 271089n
                    },
                    {
                        kind: 'other',
                        message: 'Program failed to complete: BPF program panicked'
                    }
                ]
            }
        ])
    })
})
