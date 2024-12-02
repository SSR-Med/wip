import { Injectable } from "@nestjs/common";
import OpenAI from 'openai';

import { ProductService } from "./products.service";
import { CurrencyService } from "./currencies.service";

import { isNumber } from "src/helpers/checkNumber.helper";

@Injectable()
export class ChatService {
    private readonly openaiAPIKey = process.env.OPENAI_API_KEY;
    private openai: OpenAI;
    private readonly model = "gpt-4o";

    constructor(private readonly productService: ProductService,
        private readonly currencyService: CurrencyService
    ) {
        this.openai = new OpenAI({
            apiKey: this.openaiAPIKey
        });
    }

    // Method for getting the currency message
    async getCurrencyMessage(amount:number, from: string, to: string){
        return await this.currencyService.getCurrency({ amount, from, to });
    }

    // Method for getting the recommendation message
    async getRecommendationMessage(searchTerm: string,
        toCurrency?: string
    ){
        // Get the top related rows
        let topResults = await this.productService.findRelatedRows({ searchTerm});
        // Convert the price to the desired currency
        if(toCurrency){
            // Convert the price to the desired currency
            topResults = await Promise.all(topResults.map(async row => {
                if(!isNumber(row.price)){
                    return row;
                }
                const price = Number(row.price.split(" ")[0]);
                return {
                    ...row,
                    price: (await this.currencyService.getCurrency({ amount: price, from: "USD", to: toCurrency })).result + " " + toCurrency
                }
            }))
        }
        return topResults
    }

    // Method for getting the model messages
    getModelMessages(userPrompt: string){

        const modelMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]  = [
            {
                role: 'system',
                content: 'You are a shopify assistant. You have to help the user to find products and convert currencies (use currency codes). You can change the product price to another currency, when product found then say its properties in a good manner'
            },
            {
                role: 'user',
                content: userPrompt
            }
        ]
        
        return modelMessages
    }

    // Tools for the model to get the function context
    async getFunctionContext(userPrompt: string){        
        const tools = [
            {
                type: "function" as const,
                function: {
                    name: "getCurrencyMessage",
                    parameters: {
                        type: "object",
                        properties: {
                            amount: {
                                type: "number"
                            },
                            from: {
                                type: "string"
                            },
                            to: {
                                type: "string"
                            }
                        },
                        required: ["amount", "from", "to"],
                        additionalProperties: false
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "getRecommendationMessage",
                    parameters: {
                        type: "object",
                        properties: {
                            searchTerm: {
                                type: "string"
                            },
                            toCurrency: {
                                type: "string"
                            }
                        },
                        required: ["searchTerm"],
                        additionalProperties: false
                    }
                }
            }
        ]

        // Call the model
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.getModelMessages(userPrompt),
            tools: tools
        })

        // Return the tool calls
        return response.choices[0].message.tool_calls
    }

    /*
    * @param userPrompt: string - the user prompt
    * @param function2Call: string - the function to call
    * @param function2CallParams: string - the function parameters
    * @returns Promise<string> - the response from the model
    */
    async sendMessage(userPrompt:string,function2Call: string, function2CallParams: string){

        const functionParams = JSON.parse(function2CallParams);
        // Call the function
        const jsonResponseData = await this[function2Call](...Object.values(functionParams));

        const modelMessages = this.getModelMessages(userPrompt);

        // Add the response to the model messages
        modelMessages.push({
            role: 'user',
            content: JSON.stringify(jsonResponseData)
        })
        // Add the system message
        modelMessages.push({
            role: 'system',
            content: 'Use the json data from the previous message to answer the user. If it is only a currency, then just say the new currency value, if it is a product, then say the product properties in a good manner'
        })

        // Call the model
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: modelMessages
        })

        // Return the response
        return response.choices[0].message.content;

        
    }
}