import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

// two entities in the same file
@Schema()
export class Toy {
    @Prop()
    label: string
}

export const ToySchema = SchemaFactory.createForClass(Toy)

@Schema()
export class Ball {
    @Prop()
    size: number
}

export const BallSchema = SchemaFactory.createForClass(Ball)
