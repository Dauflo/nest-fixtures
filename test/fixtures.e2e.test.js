// Runs the fixtures command of the test app against a real database, skipped when MONGODB_URI is not set
const { before, after, describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('child_process')
const mongoose = require('mongoose')
const { projectDir } = require('./helpers')

const MONGODB_URI = process.env.MONGODB_URI

describe('fixtures command', { skip: !MONGODB_URI && 'MONGODB_URI is not set', timeout: 120000 }, () => {
    let connection
    let output
    let commandError

    before(async () => {
        connection = await mongoose.createConnection(MONGODB_URI, { serverSelectionTimeoutMS: 10000 }).asPromise()
        await connection.dropDatabase()

        // never throw here: a failing `before` skips `after`, the connection would stay open and the process would never exit
        try {
            output = execFileSync(process.execPath, ['dist/fixtures', 'fixtures'], {
                cwd: projectDir('app'),
                env: { ...process.env, MONGODB_URI },
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 60000,
            })
        } catch (error) {
            commandError = error
            output = `${error.stdout ?? ''}${error.stderr ?? ''}`
        }
    })

    after(async () => {
        await connection?.close()
    })

    it('runs without error', () => {
        assert.equal(commandError, undefined, output)
    })

    it('loads the fixtures after their dependencies', () => {
        assert.ok(output.indexOf('Loading UserFixtures') < output.indexOf('Loading CatFixtures'), output)
        assert.match(output, /=== Fixtures loaded ===/)
    })

    it('inserts the documents with their references', async () => {
        const users = await connection.collection('users').find().toArray()
        const cats = await connection.collection('cats').find({}, { sort: { name: 1 } }).toArray()

        assert.deepEqual(
            users.map((user) => user.name),
            ['Alex'],
        )
        assert.deepEqual(
            cats.map((cat) => ({ name: cat.name, color: cat.color, owner: String(cat.owner), toys: cat.toys.map((toy) => toy.label) })),
            [
                { name: 'Higgins', color: 'black', owner: String(users[0]._id), toys: ['ball'] },
                { name: 'Simba', color: 'white', owner: String(users[0]._id), toys: [] },
            ],
        )
    })

    it('inserts the discriminators in their parent collection', async () => {
        const lion = await connection.collection('cats').findOne({ name: 'Simba' })

        assert.equal(lion.kind, 'Lion')
        assert.equal(lion.mane, true)
    })
})
