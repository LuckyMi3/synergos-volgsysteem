export const rubric1VO = {
    id: "1vo",
    title: "1VO – Vakopleiding Haptonomie",

    scale: {
          min: 0,
          max: 10,
          labels: {
                  0: "onbekwaam / niet eigen",
                  5: "in ontwikkeling",
                  10: "bekwaam / eigen",
          },
    },

    themes: [
      {
              id: "persoonlijke_attitude",
              title: "Persoonlijke attitude",
              questions: [
                { id: "pa_q1", text: "Ik ben me bewust van mijn eigen grondpatroon." },
                { id: "pa_q2", text: "Ik ben bekend met mijn eigen kwaliteiten." },
                { id: "pa_q3", text: "Ik ben bekend met mijn eigen valkuilen." },
                { id: "pa_q4", text: "Ik kan mijn beleving concreet verwoorden." },
                { id: "pa_q5", text: "Ik ben in staat tot metacommunicatie en overzicht." },
                { id: "pa_q6", text: "Ik heb gevoel voor het ritme en tempo van de ander." },
                { id: "pa_q7", text: "Ik kan afstemmen op een ander." },
                { id: "pa_q8", text: "Ik kan afstemmen op de groep." },
                {
                            id: "pa_q9",
                            text: "Ik ben in staat om ervaringen in het hier en nu te duiden naar het dagelijkse leven.",
                },
                      ],
      },

      {
              id: "ontwikkelingsgerichtheid",
              title: "Ontwikkelingsgerichtheid",
              questions: [
                { id: "og_q1", text: "Ik laat persoonlijke ontwikkeling in de breedte zien." },
                { id: "og_q2", text: "Ik laat persoonlijke ontwikkeling in de diepte zien." },
                { id: "og_q3", text: "Ik benut feedback voor mijn persoonlijke ontwikkeling." },
                { id: "og_q4", text: "Ik heb een onderzoekende attitude." },
                {
                            id: "og_q5",
                            text: "Ik kan kritisch reflecteren op mijn eigen handelen, voelen en denken.",
                },
                {
                            id: "og_q6",
                            text: "Ik heb vertrouwen in mijn eigen gevoelens, gedachten en handelen.",
                },
                { id: "og_q7", text: "Ik stel voelen, denken en handelen in het hier en nu centraal." },
                { id: "og_q8", text: "Ik ben congruent in voelen, denken en handelen." },
                {
                            id: "og_q9",
                            text: "Ik ben mild ten aanzien van mijn eigen onmogelijkheden, valkuilen en discongruenties.",
                },
                { id: "og_q10", text: "Ik ben kritisch op mijn gedrag, maar wijs mezelf niet af." },
                {
                            id: "og_q11",
                            text: "Ik neem verantwoordelijkheid voor mijn eigen welzijn en ruimte.",
                },
                {
                            id: "og_q12",
                            text: "Ik ben me bewust van wat de omgeving bij mezelf teweegbrengt.",
                },
                {
                            id: "og_q13",
                            text: "Ik ben me bewust van wat ik teweegbreng aan de omgeving.",
                },
                {
                            id: "og_q14",
                            text: "Ik ben in staat tot congruente expressie van mijn beleving in de interactie.",
                },
                      ],
      },

      {
              id: "oefenvormen",
              title: "Oefenvormen",
              questions: [
                { id: "ov_q1", text: "Ik ervaar bij mezelf spankracht." },
                { id: "ov_q2", text: "Ik ervaar bij mezelf draagkracht." },
                { id: "ov_q3", text: "Ik ervaar bij mezelf veerkracht." },
                { id: "ov_q4", text: "Ik ervaar bij mezelf krachteloosheid." },
                { id: "ov_q5", text: "Ik ervaar bij mezelf beweeglijkheid." },
                { id: "ov_q6", text: "Ik ervaar bij mezelf stabiliteit." },
                {
                            id: "ov_q7",
                            text: "Ik ben in staat om kracht, beweeglijkheid en stabiliteit functioneel te coördineren.",
                },
                { id: "ov_q8", text: "Ik heb inzicht in de kwaliteiten van verschillende materialen." },
                {
                            id: "ov_q9",
                            text: "Ik heb kennis van houdings- en bewegingspatronen ten opzichte van de normaal.",
                },
                {
                            id: "ov_q10",
                            text: "Ik kan handelen, denken en voelen relateren aan de emotionele expressie (emotionele aansturing) en de emotionele impressie (beleving).",
                },
                      ],
      },

      {
              id: "aanraken",
              title: "Aanraken",
              questions: [
                {
                            id: "ar_q1",
                            text: "Ik ben in staat om het eerste en het tweede deel van de drieluik, de ruime jas, en het aanreiken van de basis helder uit te voeren.",
                },
                { id: "ar_q2", text: "Ik ben me bewust van mijn stijl van aanraken." },
                {
                            id: "ar_q3",
                            text: "Ik kan mij vrijmaken van de prestatie en gericht blijven op de interactie (nonverbaal).",
                },
                      ],
      },

      {
              id: "interactie",
              title: "Interactie",
              questions: [
                { id: "in_q1", text: "Ik neem actief deel aan de interactiedynamiek in kleine groepen." },
                { id: "in_q2", text: "Ik neem actief deel aan de interactiedynamiek in de grote groep." },
                {
                            id: "in_q3",
                            text: "Ik ben me bewust van mijn eigen interactiepatronen in diverse situaties.",
                },
                      ],
      },
        ],
};
