import { Inject } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { Command, CommandRunner, Option } from 'nest-commander'
import { Fixtures } from './fixtures'

type FixturesObject = {
    [key: string]: Fixtures
}

@Command({ name: 'fixtures', description: 'load fixtures into the database' })
export class FixturesCommand extends CommandRunner {
    private fixturesDone: string[] = []

    constructor(
        @Inject('FIXTURES') private fixtures: FixturesObject,
        @InjectConnection() private readonly connection: Connection,
    ) {
        super()
    }

    private async loadData(key: string) {
        if (!this.fixturesDone.includes(key)) {
            this.fixturesDone.push(key)
            if (this.fixtures[key].getDependencies().length !== 0) {
                for (const dependency of this.fixtures[key].getDependencies()) {
                    await this.loadData(dependency)
                }
            }
            console.log(`Loading ${key}...`)
            await this.fixtures[key].load()
            console.log(`Done loading ${key}`)
        }
    }

    async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
        console.log('=== Starting fixtures load ===')
        for (const key of Object.keys(this.fixtures)) {
            await this.loadData(key)
        }
        console.log('=== Fixtures loaded ===')
        return
    }

    @Option({
        flags: '--delete',
        description: 'Purge all the current collections',
    })
    purgeDatabase() {
        console.log('Starting purging database...')
        for (const collection of Object.keys(this.connection.collections)) {
            this.connection.dropCollection(collection)
        }
        console.log('Database purging done')
    }
}
