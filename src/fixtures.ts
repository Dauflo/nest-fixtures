import { Injectable, NotImplementedException } from '@nestjs/common'

interface IFixtures {
    load(): void

    getDependencies(): string[]
}

@Injectable()
export class ReferenceRepository {
    private reference: { [key: string]: any } = {}

    addReference(key: string, data: any) {
        if (this.reference[key] !== undefined) {
            throw new Error(`Key "${key}" already exists`)
        }

        this.reference[key] = data
    }

    getReference<T = any>(key: string): T {
        if (this.reference[key] === undefined) {
            throw new Error(`Key "${key}" does not exist`)
        }
        return this.reference[key]
    }
}

export abstract class Fixtures implements IFixtures {
    async load(): Promise<void> {
        throw new NotImplementedException()
    }

    getDependencies(): string[] {
        return []
    }
}
