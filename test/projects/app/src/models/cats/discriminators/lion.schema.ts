import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

export const LION_KIND = 'Lion'

@Schema()
export class Lion {
    @Prop()
    mane: boolean
}

export const LionSchema = SchemaFactory.createForClass(Lion)
