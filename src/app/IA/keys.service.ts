import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({
  providedIn: 'root'
})
export class KeysService {

  public keys: string = "AIzaSyD6QNKRlNGeGcJyLY2ZLuY2GGLGJQTf6WA";

  constructor() { }


  genIA: any;
  model: any;


  initialize(key: string, config?: any) {

    this.genIA = new GoogleGenerativeAI(key);
    let model = config ? config : { model: 'gemini-2.0-flash' };
    this.model = this.genIA.getGenerativeModel(model);

  }

  async generateText(prompt: string) {

    if (!this.model) {
      return;
    }

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    console.log(result);
    console.log(response.text());
    return response.text();

    //
  }
}
