import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { User } from 'backend/src/entities/users/user.schema'

export const QUOTELINE_SCHEMA = {
    name: { type: String },
    quantity: { type: Number },
}

@Schema()
export class Quote {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    owner: User

    @Prop({ type: [QUOTELINE_SCHEMA] })
    lines: { name: string; quantity: number }[]
}

export const QuoteSchema = SchemaFactory.createForClass(Quote)
