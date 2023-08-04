import { remote } from "webdriverio";
import cheerio from "cheerio";

const url =
  "https://comunica.pje.jus.br/consulta?siglaTribunal=TRF1&dataDisponibilizacaoInicio=2023-07-28&dataDisponibilizacaoFim=2023-07-28";
const browser = await remote({
  capabilities: {
    browserName: "chrome",
    "goog:chromeOptions": {
      args: process.env.CI ? ["headless", "disable-gpu"] : [],
    },
  },
});


async function pageIsComplete() {
  let status = await browser.execute("document.readyState");
  await browser.pause(2000);
  console.log(status);
  if (status != "complete") return await pageIsComplete();
}

const execute = async () => {

  await browser.url(url);
 
  await pageIsComplete();
  await browser.pause(5000)
  let obj = {};
  let arr = [];
 
  let texto = '[class="tab_panel2 ng-star-inserted"]';

  let botao =
    '[class="ui-paginator-next ui-paginator-element ui-state-default ui-corner-all"]';
  
  let ultimo =
    '[class="ui-paginator-next ui-paginator-element ui-state-default ui-corner-all ui-state-disabled"]';
    
  
      while (!(await browser.$(ultimo).isDisplayed())) { 
    
    await browser.$(botao).click(); 
    
    await pageIsComplete();
   
    await browser
      .$('[class="card fadeIn"]')
      .waitForDisplayed({ timeout: 60000 });
   
    let containers = await browser.$$('[class="card fadeIn"]');
   
    for (const ind of containers) {
      
      let temporaria = await browser.$(ind).getHTML();
      
      let $ = cheerio.load(temporaria);
      
      let processo = $('span[class="numero-unico-formatado"]').text().trim();
     
      obj.numeroprocesso = processo.replace(/\D/g, "");
      
      let tabela = $('div[class="info-sumary"]')
        .get()
        .map((div) => {
          return $(div).text().trim();
        });
     
      obj.orgao = tabela[0];
      obj.datadisponibilidade = tabela[1];
      obj.tipocomunicacao = tabela[2];
      obj.meio = tabela[3];
      obj.partes = tabela[6];

      obj.conteudo = $(texto).text();
      arr.push(obj);
    }
  }
 
  console.log(arr);
 
  return arr;
};

await execute();

await browser.closeWindow();
