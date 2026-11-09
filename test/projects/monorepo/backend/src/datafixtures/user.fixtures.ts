import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures, ReferenceRepository } from '@dauflo/nest-fixtures'
import { User, UserDocument } from 'src/entities/users/user.schema'

@Injectable()
export class UserFixtures extends Fixtures {
    constructor(
        private reference: ReferenceRepository,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        super()
    }

    async load(): Promise<void> {
        const user = await new this.userModel({ name: 'Alex' }).save()
        this.reference.addReference('user', user)
    }
}
