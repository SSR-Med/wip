import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';


@Injectable()
export class CurrencyService{

    private readonly baseURL = `https://openexchangerates.org/api/latest.json?app_id=${process.env.CURRENCY_ID}&base=`

    constructor(private readonly httpService: HttpService) {

    }

    /*
    * @param amount: number - the amount to convert
    * @param from: string - the currency to convert from
    * @param to: string - the currency to convert to
    */
    async getCurrency({amount, from, to}: {amount: number, from: string, to: string}) {
        from = "USD"

        const url = this.baseURL + from;
        const responseAPI = await firstValueFrom(this.httpService.get(url));

        return {
            result: responseAPI["data"]["rates"][to] * amount,
        }
    }

}