import path from 'node:path';
import {useDatabase} from "./util/db"
import {useServer} from "./util/server"

describe('check extension', function () {
    useDatabase(path.join(__dirname, 'check-extension'))

    const client = useServer('lib/test/check-extension')

    it('can forbid with false', function () {
        return client.httpErrorTest(`
            query forbid {
                accounts { id balance }
            }
        `, {
            errors: [
                {message: 'not allowed'}
            ]
        })
    })

    it('can forbid with error message', function () {
        return client.httpErrorTest(`
            query complex {
                accounts { id balance }
            }
        `, {
            errors: [
                {message: 'too complex'}
            ]
        })
    })

    it('can allow with true', function () {
        return client.test(`
            query {
                accounts { id balance }
            }
        `, {
            accounts: []
        })
    })
})
