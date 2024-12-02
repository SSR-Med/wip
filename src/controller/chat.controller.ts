import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

import { ChatService } from '../service/chat.service';

import { sendMessageClass } from 'src/interface/chat.interface';

@Controller("/chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) {}
    
    @Post()
    @ApiResponse({ status: 201, description: 'Model delivered message successfully' })
    @ApiBody({ type: sendMessageClass })
    async sendMessage(@Body() sendMessageClass: sendMessageClass){
        const functionResponseAI = await this.chatService.getFunctionContext(sendMessageClass.userPrompt);

        const function2Call = functionResponseAI[0].function.name;
        const function2CallParams = functionResponseAI[0].function.arguments;
        
        return await this.chatService.sendMessage(sendMessageClass.userPrompt,function2Call, function2CallParams);
    }

}