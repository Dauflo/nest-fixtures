import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures, ReferenceRepository } from '@dauflo/nest-fixtures'
import { Quote } from 'src/entities/quotes/quote.schema'
import { UserFixtures } from 'backend/src/datafixtures/user.fixtures'

@Injectable()
export class QuoteFixtures extends Fixtures {
    constructor(
        private reference: ReferenceRepository,
        @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    ) {
        super()
    }

    async load(): Promise<void> {
        await new this.quoteModel({ owner: this.reference.getReference('user'), lines: [{ name: 'bolt', quantity: 2 }] }).save()
    }

    getDependencies(): string[] {
        return [UserFixtures.name]
    }
}
