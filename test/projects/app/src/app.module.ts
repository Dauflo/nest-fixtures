import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FixturesCommand, FixturesModule } from '@dauflo/nest-fixtures'

@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI),
        FixturesModule.forRootAsync('src/datafixtures/*.fixtures.ts', 'src/models/**/*.schema.ts', 'discriminators'),
    ],
    providers: [FixturesCommand],
})
export class AppModule {}
