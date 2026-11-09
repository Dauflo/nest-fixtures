import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { User } from 'src/models/users/user.schema'

// exported before the entity on purpose: the module must not rely on the export order
export const CAT_TOY_SCHEMA = { label: { type: String } }

export enum CatColor {
    BLACK = 'black',
    WHITE = 'white',
}

export type CatDocument = HydratedDocument<Cat>

@Schema({ discriminatorKey: 'kind' })
export class Cat {
    @Prop()
    name: string

    @Prop({ type: String, enum: CatColor })
    color: CatColor

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    owner: User

    @Prop({ type: [CAT_TOY_SCHEMA] })
    toys: { label: string }[]
}

export const CatSchema = SchemaFactory.createForClass(Cat)
