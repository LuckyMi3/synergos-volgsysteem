// lib/rubrics/2vo.ts
// Bron: "Beoordelingsformulier Vakopleiding Haptonomie – Jaar 2 (2VO)" (2026)
// Vraagteksten in ik-vorm, zelfde stijl als 1VO.
// Scale 1–10 (schuifjes), conform 1VO.
export type RubricScale = {
    min: number;
    max: number;
  labels: string[] | Record<number, string>; // array (index 0..(max-min)) of sparse object (bv. {1: "...", 10: "..."})
    };

export type RubricQuestion = {
    id: string;
    text: string;
};

export type RubricTheme = {
    id: string;
    title: string;
    questions: RubricQuestion[];
};

export type RubricDefinition = {
    key: string;
    title: string;
    version: string;
    scale: RubricScale;
    themes: RubricTheme[];
};

export const rubric2VO: RubricDefinition = {
    key: "2vo",
    title: "Vakopleiding Haptonomie – Jaar 2 (2VO)",
    version: "2026-02-25",
    scale: {
          min: 1,
                    max: 10,
                    labels: {
                                        1: "Onvoldoende / niet zichtbaar",
                                        3: "In ontwikkeling",
                                        5: "Voldoende (niveau jaar 2)",
                                        7: "Goed",
                                        10: "Zeer goed / geïntegreerd en bewust ingezet",
                    },
    },
    themes: [
      {
              id: "c1",
              title: "1. Waarnemings- en ervaringscompetentie",
              questions: [
                { id: "c1_q1", text: "Ik neem waar bij mezelf." },
                { id: "c1_q2", text: "Ik neem waar bij de cliënt." },
                { id: "c1_q3", text: "Ik ben aantoonbaar bewust van de interactiedynamiek." },
                { id: "c1_q4", text: "Ik onderscheid waarneming, beleving en interpretatie." },
                { id: "c1_q5", text: "Ik verbind waarnemingen uit gesprek, oefening en aanraking." },
                { id: "c1_q6", text: "Ik formuleer voorlopige conclusies open en toetsbaar." },
                      ],
      },
      {
              id: "c2",
              title: "2. Haptonomisch vakmanschap",
              questions: [
                { id: "c2_q1", text: "Ik voer de intake gestructureerd en afgestemd uit." },
                { id: "c2_q2", text: "Ik presenteer de haptonomische werkwijze helder." },
                { id: "c2_q3", text: "Ik zet aanraking afgestemd in." },
                { id: "c2_q4", text: "Ik zet aanraking doelgericht in." },
                { id: "c2_q5", text: "Ik wissel bewust tussen interactieposities." },
                {
                            id: "c2_q6",
                            text: "Ik bied passende ervaringsmogelijkheden aan in gesprek en oefening.",
                },
                      ],
      },
      {
              id: "c3",
              title: "3. Begeleidingscompetentie",
              questions: [
                { id: "c3_q1", text: "Ik bouw veiligheid en vertrouwen op." },
                { id: "c3_q2", text: "Ik kan actuele gevoelens op maat naar voren brengen." },
                {
                            id: "c3_q3",
                            text: "Ik kan stimuleren in het onderzoeken van de beleving van de cliënt.",
                },
                { id: "c3_q4", text: "Ik verhelder en verdiep de hulpvraag." },
                { id: "c3_q5", text: "Ik kan abstraheren en duiden naar andere situaties." },
                {
                            id: "c3_q6",
                            text: "Ik kan actuele ervaringen in aanraken relateren aan doelstellingen.",
                },
                {
                            id: "c3_q7",
                            text: "Ik kan actuele ervaringen in gesprek relateren aan doelstellingen.",
                },
                {
                            id: "c3_q8",
                            text: "Ik kan actuele ervaringen in oefenvormen relateren aan doelstellingen.",
                },
                { id: "c3_q9", text: "Ik kom tot een gezamenlijke doelstelling." },
                { id: "c3_q10", text: "Ik blijf aanwezig bij emotionele processen." },
                { id: "c3_q11", text: "Ik begeleid veranderingsprocessen afgestemd." },
                      ],
      },
      {
              id: "c4",
              title: "4. Diagnostische competentie",
              questions: [
                { id: "c4_q1", text: "Ik verzamel relevante informatie in de eerste ontmoeting." },
                { id: "c4_q2", text: "Ik herken patronen bij de cliënt." },
                { id: "c4_q3", text: "Ik herken mijn eigen reacties en posities." },
                { id: "c4_q4", text: "Ik formuleer een voorlopige haptonomische diagnose." },
                { id: "c4_q5", text: "Ik verbind geschiedenis met het hier-en-nu." },
                      ],
      },
      {
              id: "c5",
              title: "5. Interventie- en handelingscompetentie",
              questions: [
                {
                            id: "c5_q1",
                            text: "Ik leg de nadruk op mogelijkheden en moeilijkheden in het hier en nu.",
                },
                { id: "c5_q2", text: "Ik kan luisteren en samenvatten." },
                { id: "c5_q3", text: "Ik kan verdiepen en ordenen." },
                { id: "c5_q4", text: "Ik kan confronteren en concretiseren." },
                { id: "c5_q5", text: "Ik maak bewuste interventiekeuzes." },
                { id: "c5_q6", text: "Ik kan op passende wijze feedback geven aan de cliënt." },
                { id: "c5_q7", text: "Ik ga zorgvuldig om met ruimte en grenzen." },
                { id: "c5_q8", text: "Ik zoek de grenzen van de mogelijkheden op." },
                { id: "c5_q9", text: "Ik kan omgaan met de emotie angst – vluchten." },
                { id: "c5_q10", text: "Ik kan omgaan met de emotie angst – bevriezen." },
                { id: "c5_q11", text: "Ik kan omgaan met de emotie angst – vechten." },
                { id: "c5_q12", text: "Ik kan omgaan met boosheid." },
                { id: "c5_q13", text: "Ik kan omgaan met de emotie verdriet." },
                { id: "c5_q14", text: "Ik kan omgaan met de emotie blij." },
                {
                            id: "c5_q15",
                            text: "Ik kan mijn eigen interactiepositie variëren ten dienste van de ontwikkeling van de cliënt.",
                },
                { id: "c5_q16", text: "Ik voorkom herhaling zonder ontwikkeling." },
                { id: "c5_q17", text: "Ik ben me bewust van de rode draad in de begeleiding." },
                { id: "c5_q18", text: "Ik kan procesmatig en systematisch werken." },
                { id: "c5_q19", text: "Ik kan het interventieschema hanteren ter evaluatie." },
                      ],
      },
      {
              id: "c6",
              title: "6. Professionele attitude en ethisch handelen",
              questions: [
                { id: "c6_q1", text: "Ik handel ten dienste van de cliënt." },
                {
                            id: "c6_q2",
                            text: "Ik doe appel op eigen verantwoordelijkheid, vermogen en inzicht van de cliënt.",
                },
                {
                            id: "c6_q3",
                            text: "Ik aanvaard de cliënt zoals deze is; ik kan gedrag afwijzen maar niet de persoon.",
                },
                { id: "c6_q4", text: "Ik ben me bewust van mijn eigen normen en wereldbeeld." },
                { id: "c6_q5", text: "Ik ben me bewust van mijn eigen inkleuring/betekenisverlening." },
                { id: "c6_q6", text: "Ik herken (in)congruentie in mijn eigen handelen." },
                { id: "c6_q7", text: "Ik neem verantwoordelijkheid voor grenzen." },
                { id: "c6_q8", text: "Ik reflecteer ethisch kritisch op mijn eigen handelen." },
                      ],
      },
      {
              id: "c7",
              title: "7. Creativiteit en exploratievermogen",
              questions: [
                { id: "c7_q1", text: "Ik onderzoek vanuit meerdere perspectieven." },
                { id: "c7_q2", text: "Ik toon flexibiliteit in aanpak." },
                { id: "c7_q3", text: "Ik kan doorpakken op onderwerpen." },
                { id: "c7_q4", text: "Ik benut vrijheid binnen professionele kaders." },
                { id: "c7_q5", text: "Ik stimuleer cliënten tot nieuwe ervaringen." },
                { id: "c7_q6", text: "Ik blijf fris en onderzoekend." },
                      ],
      },
      {
              id: "c8",
              title: "8. Theoretische integratiecompetentie",
              questions: [
                { id: "c8_q1", text: "Ik pas theorie toe in de praktijk." },
                { id: "c8_q2", text: "Ik benoem relevante theorieën bij een casus." },
                { id: "c8_q3", text: "Ik onderscheid haptonomische en andere benaderingen." },
                { id: "c8_q4", text: "Ik onderbouw keuzes theoretisch." },
                { id: "c8_q5", text: "Ik integreer theorie en ervaring." },
                      ],
      },
      {
              id: "c9",
              title: "9. Reflectie- en evaluatiecompetentie",
              questions: [
                { id: "c9_q1", text: "Ik reflecteer systematisch op mijn eigen handelen." },
                { id: "c9_q2", text: "Ik benoem sterke kanten en ontwikkelpunten." },
                { id: "c9_q3", text: "Ik ontvang feedback open en onderzoekend." },
                { id: "c9_q4", text: "Ik pas feedback toe in mijn handelen." },
                { id: "c9_q5", text: "Ik draag bij aan groepsreflectie." },
                      ],
      },
        ],
};

export default rubric2VO;
