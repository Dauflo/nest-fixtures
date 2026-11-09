import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@Schema()
export class Thing {
    @Prop()
    name: string
}

export class ThingHelper {}

// neither named after the class nor alone in the file
export const SomethingSchema = SchemaFactory.createForClass(Thing)
