import OpenAI from 'openai';
import { InternalServerErrorException } from '@nestjs/common';

const fs = require('fs');
const Papa = require('papaparse');
const similarity = require( 'compute-cosine-similarity');

import { resolve } from 'path';

export class ProductService{
    private readonly openaiAPIKey = process.env.OPENAI_API_KEY;
    private openai: OpenAI;
    private readonly model = "text-embedding-ada-002";
    private readonly columnName = "embeddingText"
    private readonly pathCsv = resolve(__dirname,'../public/products_list.csv')

    constructor(){
        this.openai = new OpenAI({
            apiKey: this.openaiAPIKey
        });
    }

    /*
    * @param text: string - the text to generate the embedding
    * @returns Promise<string> - the embedding of the text
    */
    private async getEmbedding(text: string){
        try{
            const embedding = await this.openai.embeddings.create({
                model: this.model,
                input: text
            })
            return embedding.data[0].embedding;
        }catch(error){
            throw new InternalServerErrorException('Error generating embedding', error.message);
        }
    }

    // This function will transform the csv file to a json object
    private transformCsv2Json(): Promise<any[]> {
        // Read the file
        const file = fs.createReadStream(this.pathCsv);
        // Create a promise to parse the file
        const promiseParse = new Promise<any[]>((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: results => {
                    resolve(results.data);
                }
            })
        })
        // Wait for the promise to resolve
        return promiseParse;
    }

    /*
    * @param searchTerm: string - the search term to find related rows
    * @param topN: number - the number of top related rows to return
    * @returns Promise<any[]> - the top related rows
    */
    async findRelatedRows({searchTerm}: {searchTerm: string}){
        const topN = 2;

        // Get the data from the csv file
        const tableData: any[] = await this.transformCsv2Json();

        // Get the embedding of the search term
        const searchEmbedding = await this.getEmbedding(searchTerm);
        
        // Create an array of promises to get the embedding of each row
        const embeddingPromises = tableData.map(async (row) => {
            const text = row[this.columnName];
            const embedding = await this.getEmbedding(text);
            
            const sim = similarity(searchEmbedding, embedding);
            return { row, sim };
        });

        // Wait for all the promises to resolve
        const similarityResults = await Promise.all(embeddingPromises);

        // Sort the results by similarity and get the top N
        const topResults = similarityResults.slice(0, topN);
        topResults.sort((a, b) => b.sim - a.sim);
        
        // Return the top N rows
        return topResults.map(row => row.row);
    }

}