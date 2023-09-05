import assert from 'assert'
import {it} from 'node:test'
import {HttpClient} from './client'


it('basic auth', async () => {
    let client = new HttpClient()
    let credentials = await client.get('http://hello:world@httpbin.org/basic-auth/hello/world')
    assert.deepStrictEqual(credentials, {authenticated: true, user: 'hello'})
})
