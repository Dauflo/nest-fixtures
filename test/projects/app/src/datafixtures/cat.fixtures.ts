import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures, ReferenceRepository } from '@dauflo/nest-fixtures'
import { Cat, CatColor, CatDocument } from 'src/models/cats/cat.schema'
import { Lion } from 'src/models/cats/discriminators/lion.schema'
import { UserFixtures } from 'src/datafixtures/user.fixtures'

// exported before the fixtures on purpose: the module must not rely on the export order
export const CAT_NAMES = ['Higgins', 'Simba']

@Injectable()
export class CatFixtures extends Fixtures {
    constructor(
        private reference: ReferenceRepository,
        @InjectModel(Cat.name) private catModel: Model<CatDocument>,
        @InjectModel(Lion.name) private lionModel: Model<Lion & Cat>,
    ) {
        super()
    }

    async load(): Promise<void> {
        const owner = this.reference.getReference('user')
        await new this.catModel({ name: CAT_NAMES[0], color: CatColor.BLACK, owner, toys: [{ label: 'ball' }] }).save()
        await new this.lionModel({ name: CAT_NAMES[1], color: CatColor.WHITE, owner, mane: true }).save()
    }

    getDependencies(): string[] {
        return [UserFixtures.name]
    }
}
