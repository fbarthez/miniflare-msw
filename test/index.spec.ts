// test/index.spec.ts
import anyTest, { TestInterface } from "ava"
import { ConsoleLog, Miniflare } from "miniflare"
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// specify test type with Miniflare as context
const test = anyTest as TestInterface<{ mf: Miniflare }>

// configure mock service worker to handle requests to 3rd party APIs
const server = setupServer(

    rest.get('https://some.domain.test/lookup', (req, res, ctx) => {
        const phone = req.url.searchParams.get('phone_number')
        console.log({ phone })
        if ('123' == phone) {
            return res(ctx.json({ name: 'Foo Bar' }))
        } else {
            return res(
                ctx.status(404),
                ctx.json({ error: 'number unknown', status: 'failure' }))
        }
    })

)

test.before(() => {
    // start mock service worker
    server.listen()
})

test.beforeEach((t) => {
    // Create a new Miniflare environment for each test
    const mf = new Miniflare({
        buildCommand: undefined,
        https: true,
        scriptPath: 'dist/worker.js',
        log: new ConsoleLog(true)
    })
    t.context = { mf }
})

test.after.always(() => {
    // stop mock service worker
    server.close()
})

test.afterEach.always((t) => {
    // reset mock service worker to default config
    server.resetHandlers()
})

const baseURL = "https://127.0.0.1:8787"

test("unknown phone number returns 404", async (t) => {
    const { mf } = t.context
    const res = await mf.dispatchFetch(`${baseURL}/api/?phone_number=321`)

    t.is(res.status, 404)
    t.is(await res.text(), '{"error":"number unknown","status":"failure"}')
})

test("known phone number returns 200", async (t) => {
    const { mf } = t.context
    const res = await mf.dispatchFetch(`${baseURL}/api/?phone_number=123`)

    t.is(res.status, 200)
    t.is(await res.text(), '{"name":"Foo Bar"}')
})
