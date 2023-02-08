<div align="center">
    <p align="center">
        <img src="public/nestjs-icon.svg" width="120" alt="NestJS Logo" />
        <img src="public/mongodb-icon.svg" width="120" alt="MongoDB Logo" />
    </p>
</div>

# NestJS Fixtures

Tired of creating random script to insert data into your database, tired of your coworkers asking you to update the data, this package is made for you!
`Nest Fixtures` allow you to turn all your data schemas into `fixtures` to populate your database.
Currently this package only works for Mongodb databases.

## Installation

Before you get started, you'll have to install a few packages. Obviously you need `@dauflo/nest-fixtures`. You'll also need `nest-commander` to run your fixtures command.

```bash
npm i nest-commander @dauflo/nest-fixtures
```

## How to use

You'll need to create a `datafixtures` directory inside `src`, this is where you'll write all your fixtures.

A fixtures file could look like this:

```ts
// src/datafixtures/cat.fixtures.ts

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures } from '@dauflo/nest-fixtures'
import { Cat, CatDocument } from 'src/models/cats/cat.schema'

@Injectable()
export class CatFixtures extends Fixtures {
    constructor(@InjectModel(Cat.name) private catModel: Model<CatDocument>) {
        super()
    }

    async load(): Promise<void> {
        // do your logic
    }
}
```

Congratz! You have you first fixtures, it's now time to populate your database. To do so, head to you `app.module.ts` file and add the following lines.

```ts
// src/app.module.ts

import { FixturesCommand, FixturesModule } from '@dauflo/nest-fixtures'

@Module({
    imports: [
        FixturesModule.forRootAsync(
            'src/datafixtures/*.fixtures.ts',
            'src/models/**/*.schema.ts'
        )
    ],
    providers: [
        FixturesCommand
    ]
})
export class AppModule {}
```

You can change the directory path schema to match you project directory structure.

Now you need to create a new entrypoint file and update a bit your `packages.json`

```ts
// src/fixtures.ts

import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module";

async function bootstrap() {
    await CommandFactory.run(AppModule)
}

bootstrap()
```

```json
"scripts": {
    "fixtures": "npm run build && node dist/fixtures fixtures",
    "fixtures:delete": "npm run build && node dist/fixtures fixtures --delete"
}
```

You can now run either:

* `npm run fixtures` to import data into your database
* `npm run fixtures:delete` to purge the database and import data

### Fixtures dependencies

You'll sometimes have some fixtures that will require data from other fixtures.

```ts
// src/datafixtures/user.fixtures.ts

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures, ReferenceRepository } from '@dauflo/nest-fixtures'
import { User, UserDocument } from 'src/models/users/user.schema'

@Injectable()
export class UserFixtures extends Fixtures {
    constructor(
        private reference: ReferenceRepository,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {
        super()
    }

    async load(): Promise<void> {
        const user = new this.userModel({
            name: 'Alex'
        })

        const userDoc = await user.save()
        this.reference.addReference('user', userDoc)
    }
}
```

```ts
// src/datafixtures/cat.fixtures.ts

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Fixtures } from '@dauflo/nest-fixtures'
import { Cat, CatDocument } from 'src/models/cats/cat.schema'

@Injectable()
export class CatFixtures extends Fixtures {
    constructor(
        private reference: ReferenceRepository,
        @InjectModel(Cat.name) private catModel: Model<CatDocument>
    ) {
        super()
    }

    async load(): Promise<void> {
        const user = this.reference.getReference('user')
        new this.catModel({
            name: 'Higgins',
            owner: user
        }).save()
    }

    getDependencies(): string[] {
        return [UserFixtures.name]
    }
}
```

To create dependencies, just add the `getDependencies` method and give the fixtures you need.

The `ReferenceRepository` is a `singleton` that will keep track of the data passed from fixtures to fixtures.

## Discriminator
You can use the mongoose discriminator feature in your fixtures. You just need to add put your discriminators class in a folder named for example `discri` and add the following definition when importing the fixtures modules:

```ts
// src/app.module.ts

import { FixturesCommand, FixturesModule } from '@dauflo/nest-fixtures'

@Module({
    imports: [
        FixturesModule.forRootAsync(
            'src/datafixtures/*.fixtures.ts',
            'src/models/**/*.schema.ts',
            'discri'
        )
    ],
    providers: [
        FixturesCommand
    ]
})
export class AppModule {}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.