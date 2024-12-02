import { Module } from "@nestjs/common";
import { ChatController } from "src/controller/chat.controller";

import { ChatService } from "src/service/chat.service";
import { ProductService } from "src/service/products.service";
import { CurrencyService } from "src/service/currencies.service";

import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    controllers: [ChatController],
    providers: [ChatService,ProductService, CurrencyService]
})
export class ChatModule{}