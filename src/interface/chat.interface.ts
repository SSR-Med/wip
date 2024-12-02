import { ApiProperty } from "@nestjs/swagger";

export class sendMessageClass{
    @ApiProperty()
    userPrompt: string;
}