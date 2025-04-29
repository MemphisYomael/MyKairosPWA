import { Component, Inject } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsermonResponse } from '../../interfaces/isermon-response';
import saveAs from 'file-saver';
import * as htmlDocx from "html-docx-js";
import { Document, Packer, Paragraph, TextRun } from 'docx';


@Component({
  selector: 'app-vista-previa',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './vista-previa.component.html',
  styleUrl: './vista-previa.component.css'
})
export class VistaPreviaComponent {
  texto: string = '';
  transform(value: string | undefined ): string {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, '');
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: {objeto: IsermonResponse}){
  }


  ngOnInit(){
  this.texto = this.data.objeto.contenido!;
  }


  exportToPdf(html: any){
    // Crear un iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Escribir el HTML en el iframe
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    // Esperar a que el contenido se cargue en el iframe
    iframe.onload = () => {
      // Imprimir el iframe
      iframe.contentWindow!.print();
    };
  }
  exportHtmlToDocx(html: any) {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(html)],
            }),
          ],
        },
      ],
    });
  
    Packer.toBlob(doc).then((blob: string | Blob) => {
      saveAs(blob, 'documento.docx');
    });
  }

  htmlToDocx(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const paragraphs: Paragraph[] = [];

    // Buscar todos los párrafos <p> (puedes añadir más etiquetas si lo necesitas)
    const pTags = doc.querySelectorAll('p');

    pTags.forEach((pTag) => {
        let children: any = [];

        // Verificar los hijos dentro de cada párrafo
        pTag.childNodes.forEach((node: any) => {
            if (node.nodeName === '#text') {
                // Si es texto normal, lo añadimos tal cual
                children.push(new TextRun(node.textContent));
            } else if (node.nodeName === 'B') {
                // Si es <b>, lo convertimos a negrita
                children.push(new TextRun({ text: node.textContent, bold: true }));
            } else if (node.nodeName === 'I') {
                // Si es <i>, lo convertimos a cursiva
                children.push(new TextRun({ text: node.textContent, italics: true }));
            } else if (node.nodeName === 'U') {
                // Si es <u>, lo convertimos a subrayado
                children.push(new TextRun({ text: node.textContent, underline: {} }));
            }
        });

        // Crear un párrafo con los "TextRun" procesados
        paragraphs.push(new Paragraph({
            children: children,
        }));
    });

    // Crear el documento DOCX con los párrafos procesados
    const document = new Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    // Empaquetar el documento y descargarlo
    Packer.toBlob(document).then((blob: string | Blob) => {
        saveAs(blob, 'documento.docx');
    });
}



}