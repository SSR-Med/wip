import { Module } from '@nestjs/common';
import { ChatModule } from './module/chat.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatModule],
})
export class AppModule {}
