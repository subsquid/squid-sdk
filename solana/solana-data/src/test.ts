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
                success: true,
                stackHeight: 1,
                programId: 'ComputeBudget111111111111111111111111111111',
                log: []
            },
            {
                success: false,
                stackHeight: 1,
                programId: 'GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi',
                log: [
                    'Program log: Xa nhau lau nay em quen ai chua. Co ai yeu em nhu anh khi xua ???',
                    {
                        success: true,
                        stackHeight: 2,
                        programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                        log: [
                            'Program log: ray_log: AwBlzR0AAAAAAAAAAAAAAAABAAAAAAAAAEu/2B0AAAAAbe4RB0RRBgBRRjF0EgAAABefogAdCgAA',
                            {
                                success: true,
                                stackHeight: 3,
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                log: [
                                    'Program log: Instruction: Transfer',
                                    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 341802 compute units'
                                ]
                            },
                            {
                                success: true,
                                stackHeight: 3,
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                log: [
                                    'Program log: Instruction: Transfer',
                                    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 334250 compute units'
                                ]
                            },
                            'Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 119245 of 448044 compute units'
                        ]
                    },
                    {
                        success: true,
                        stackHeight: 2,
                        programId: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
                        log: [
                            'Program log: Instruction: Swap',
                            {
                                success: true,
                                stackHeight: 3,
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                log: [
                                    'Program log: Instruction: Transfer',
                                    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 280381 compute units'
                                ]
                            },
                            {
                                success: true,
                                stackHeight: 3,
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                log: [
                                    'Program log: Instruction: MintTo',
                                    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 244311 compute units'
                                ]
                            },
                            {
                                success: true,
                                stackHeight: 3,
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                log: [
                                    'Program log: Instruction: Transfer',
                                    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 236861 compute units'
                                ]
                            },
                            'Program 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP consumed 67095 of 298680 compute units'
                        ]
                    },
                    "Program log: panicked at 'Dau vi nhau vay la qua du roi. Dung tim nhau nua !!!', src\\processor.rs:79:13",
                    'Program GVXG8ciCwhoqP6BEpPsGb8Q5JzBqFs8CkQrZv3rLXmXi consumed 271089 of 500000 compute units',
                    'Program failed to complete: BPF program panicked'
                ]
            }
        ])
    })
})
