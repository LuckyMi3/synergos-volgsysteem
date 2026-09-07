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
                    id: "zelfbewustzijn_zelfreflectie",
                    title: "Zelfbewustzijn en zelfreflectie",
                    questions: [
                        { id: "zz_q1", text: "Ik kan in woorden brengen wat ik voel in een concrete situatie." },
                        { id: "zz_q2", text: "Ik kan in woorden brengen wat ik denk in een concrete situatie." },
                        { id: "zz_q3", text: "Ik kan in woorden brengen wat ik doe in een concrete situatie." },
                        {
                                      id: "zz_q4",
                                      text: "Ik herken en benoem mijn eigen automatische reacties en patronen (grondpatroon).",
                        },
                        { id: "zz_q5", text: "Ik toon bewustzijn van mijn persoonlijke kwaliteiten." },
                        { id: "zz_q6", text: "Ik toon bewustzijn van mijn persoonlijke valkuilen." },
                        { id: "zz_q7", text: "Ik sta open voor feedback zonder mezelf te verdedigen." },
                        { id: "zz_q8", text: "Ik ben in staat tot metacommunicatie en overzicht." },
                              ],
          },

          {
                    id: "ontwikkelvermogen_creativiteit",
                    title: "Ontwikkelvermogen en creativiteit",
                    questions: [
                        {
                                      id: "oc_q1",
                                      text: "Ik herken momenten van groei, stagnatie en rijping in mijn eigen leerproces.",
                        },
                        {
                                      id: "oc_q2",
                                      text: "Ik experimenteer met nieuwe manieren van bewegen, reageren of waarnemen.",
                        },
                        {
                                      id: "oc_q3",
                                      text: "Ik kan onzekerheid of niet-weten verdragen zonder dit direct te willen oplossen.",
                        },
                        {
                                      id: "oc_q4",
                                      text: "Ik toon initiatief in het onderzoeken van mijn eigen ontwikkelvragen.",
                        },
                        { id: "oc_q5", text: "Ik pas inzichten uit ervaringen toe in nieuw gedrag." },
                        { id: "oc_q6", text: "Ik verdiep mijn eigen kwaliteiten." },
                              ],
          },

          {
                    id: "lichaamsbewustzijn_belichaamde_ervaring",
                    title: "Lichaamsbewustzijn en belichaamde ervaring",
                    questions: [
                        {
                                      id: "lb_q1",
                                      text: "Ik benoem lichamelijke sensaties zoals spanning, ontspanning, ruimte of zwaarte.",
                        },
                        { id: "lb_q2", text: "Ik herken veranderingen in ademhaling, houding en beweging." },
                        { id: "lb_q3", text: "Ik kan bewust contact maken met bekken en bodem." },
                        {
                                      id: "lb_q4",
                                      text: "Ik stem aanraking af op mijn eigen beleving en die van de ander.",
                        },
                        { id: "lb_q5", text: "Ik reflecteer op de invloed van mijn eigen lichaam in interactie." },
                        {
                                      id: "lb_q6",
                                      text: "Ik ben in staat om op een congruente wijze expressie te geven aan de beleving.",
                        },
                              ],
          },

          {
                    id: "waarnemen_fenomenologisch_denken",
                    title: "Waarnemen en fenomenologisch denken",
                    questions: [
                        {
                                      id: "wf_q1",
                                      text: "Ik beschrijf wat ik waarneem zonder directe interpretatie of oordeel.",
                        },
                        { id: "wf_q2", text: "Ik maak onderscheid tussen wat ik zie, voel en denk." },
                        { id: "wf_q3", text: "Ik kan ervaringen zorgvuldig en concreet verwoorden." },
                        { id: "wf_q4", text: "Ik herken terugkerende patronen in ervaringen en interacties." },
                        { id: "wf_q5", text: "Ik verbind ervaringen aan aangereikte theorieën en modellen." },
                        { id: "wf_q6", text: "Ik stel voelen, denken en handelen in het hier en nu centraal." },
                              ],
          },

          {
                    id: "interactie_relationele_competentie",
                    title: "Interactie en relationele competentie",
                    questions: [
                        {
                                      id: "ir_q1",
                                      text: "Ik ben me bewust van de consequenties van de manier waarop ik ruimte inneem.",
                        },
                        { id: "ir_q2", text: "Ik ben in staat om ruimte te geven." },
                        { id: "ir_q3", text: "Ik ben aandachtig in contact." },
                        { id: "ir_q4", text: "Ik kan expressie geven van mezelf in het contact." },
                        { id: "ir_q5", text: "Ik geef blijk van herkenning van mijn eigen grenzen." },
                        { id: "ir_q6", text: "Ik geef blijk van herkenning van de grenzen van de ander." },
                        { id: "ir_q7", text: "Ik reageer afgestemd op verbale en non-verbale signalen." },
                        { id: "ir_q8", text: "Ik kan benoemen wat contact met de ander met mij doet." },
                        {
                                      id: "ir_q9",
                                      text: "Ik kan benoemen wat ik in het contact met de ander doe en wat de cliënt doet.",
                        },
                              ],
          },

          {
                    id: "beginnende_professionele_houding",
                    title: "Beginnende professionele houding",
                    questions: [
                        { id: "bp_q1", text: "Ik toon een open en respectvolle houding naar cliënten." },
                        { id: "bp_q2", text: "Ik kan luisteren zonder direct te sturen of te adviseren." },
                        { id: "bp_q3", text: "Ik herken een hulpvraag en kan deze verwoorden." },
                        { id: "bp_q4", text: "Ik handel zorgvuldig en op maat in aanraking en nabijheid." },
                        {
                                      id: "bp_q5",
                                      text: "Ik reflecteer op mijn eigen rol en handelen in begeleide cliëntsituaties.",
                        },
                        { id: "bp_q6", text: "Ik ben in staat om ervaringen in het hier en nu te duiden." },
                        { id: "bp_q7", text: "Ik kan betekenis verlenen vanuit metacommunicatie." },
                        {
                                      id: "bp_q8",
                                      text: "Ik ben in staat om het eerste en het tweede deel van de drieluik, de ruime jas, en het aanreiken van de basis helder uit te voeren.",
                        },
                        { id: "bp_q9", text: "Ik ben me bewust van mijn stijl van aanraken." },
                        {
                                      id: "bp_q10",
                                      text: "Ik kan mij vrijmaken van de prestatie en gericht blijven op de interactie (nonverbaal).",
                        },
                              ],
          },

          {
                    id: "reflectie_evaluatie_feedback",
                    title: "Reflectie, evaluatie en feedback",
                    questions: [
                        { id: "re_q1", text: "Ik formuleer persoonlijke leerdoelen." },
                        {
                                      id: "re_q2",
                                      text: "Ik geef constructieve, respectvolle feedback aan medestudenten.",
                        },
                        {
                                      id: "re_q3",
                                      text: "Ik ontvang feedback en onderzoek de betekenis ervan voor mijn eigen ontwikkeling.",
                        },
                        {
                                      id: "re_q4",
                                      text: "Ik kan benoemen hoe groepsprocessen invloed hebben op mijn eigen leren.",
                        },
                        { id: "re_q5", text: "Ik ervaar bij mezelf spankracht." },
                        { id: "re_q6", text: "Ik ervaar bij mezelf draagkracht." },
                        { id: "re_q7", text: "Ik ervaar bij mezelf veerkracht." },
                        { id: "re_q8", text: "Ik ervaar bij mezelf krachteloosheid." },
                        { id: "re_q9", text: "Ik ervaar bij mezelf beweeglijkheid." },
                        { id: "re_q10", text: "Ik ervaar bij mezelf stabiliteit." },
                        {
                                      id: "re_q11",
                                      text: "Ik ben in staat om kracht, beweeglijkheid en stabiliteit functioneel te coördineren.",
                        },
                        {
                                      id: "re_q12",
                                      text: "Ik heb inzicht in de kwaliteiten van verschillende materialen.",
                        },
                        {
                                      id: "re_q13",
                                      text: "Ik heb kennis van houdings- en bewegingspatronen ten opzichte van de normaal.",
                        },
                        {
                                      id: "re_q14",
                                      text: "Ik kan handelen, denken en voelen relateren aan de emotionele expressie (emotionele aansturing) en de emotionele impressie (beleving).",
                        },
                        { id: "re_q15", text: "Ik neem actief deel aan de kleine groepjes." },
                        { id: "re_q16", text: "Ik neem actief deel aan de grote groep." },
                              ],
          },
            ],
};
