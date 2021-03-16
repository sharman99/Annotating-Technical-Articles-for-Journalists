const API_KEY = "Ds4BRd3GkrA5Uby8";
const PROXY = "https://floating-sea-66273.herokuapp.com/";

const parseResult = result => {

  const { metadata, summary } = result;
  for (var section in summary) {
    summary[section] = summary[section].map(s => s.sentence).join(" ");
  }

  return {
    metadata,
    summaries: summary,
  }

};

// Cached, since may call once to get title, later for summaries, etc.
export function getDoPaperDigest() {

  const PRETEND = false; // Don't use up API calls while developing
  let cache = {};

  return (file, nSentences=3) => {
    const fileKey = file.lastModified + "-" + file.name; 
    return new Promise((resolve, reject) => {

      if (fileKey in cache) { 
        console.log("paper digest: returning from cache");
        resolve(cache[fileKey]);
      } else {

        console.log("paper digest: recomputing");
        if (PRETEND) {
          const result = {
            "metadata":{"doi":"10.1016/j.cell.2020.06.040","summary_version":"v3.1--20200908c","created":"2021-03-07 01:18:45","file_type":"PDF","title":"Making Sense of Mutation: What D614G Means for the COVID-19 Pandemic Remains Unclear","journal":"Cell","license":"https://www.elsevier.com/tdm/userlicense/1.0/","publisher":"Elsevier BV","year":"2020","authors":"Grubaugh, Hanage, Rasmussen","abstract":"In this issue of Cell, Korber et al. found that a SARS-CoV-2 variant in the spike protein D614G rapidly became dominant around the world. Although clinical and in vitro data suggest that D614G changes the virus phenotype, the impact of the mutation on transmission, disease, and vaccine and therapeutic development are largely unknown."},
            "summary":{
              "introduction":[{"sentence":"The crucial questions are whether this is the result of natural selection and what it means for the COVID-19 pandemic.","order":7},{"sentence":"Still, these data do not prove that G614 is more infectious or transmissible than viruses containing D614.","order":11},{"sentence":"And because of that, many questions remain on the potential impacts, if any, that D614G has on the COVID-19 pandemic.","order":12}],
              "conclusions":[{"sentence":"Because the specific effect of D614G on spike function in entry and fusion is unknown, the impact of this mutation on therapeutic entry inhibitors is unknown.","order":46},{"sentence":"There is no current evidence that it would interfere with therapeutic strategies such as monoclonal antibodies designed to disrupt spike binding with ACE2 or drugs that modulate downstream processes such as endosomal acidification.","order":47},{"sentence":"Although there has already been much breathless commentary on what this mutation means for the COVID-19 pandemic, the global expansion of G614 whether through natural selection or chance means that this variant now is the pandemic.","order":50}]}
          };

          const parsedResult = parseResult(result);
          cache[fileKey] = parsedResult;
          console.log("PD final: ", parsedResult);
          resolve(parsedResult);

        } else {

          const url = "http://www.paper-digest.com/pdf";
          let headers = new Headers();
          headers.append("key", API_KEY);
          let body = new FormData();
          body.append("pdf-input", file, "pdf.pdf");
          body.append("ns", nSentences);

          const requestOptions = {
            body,
            headers,
            method: "POST",
            redirect: "follow",
          };

          fetch(PROXY + url, requestOptions)
            .then(response => response.json())
            .then(result => {

              const parsedResult = parseResult(result);
              cache[fileKey] = parsedResult;
              console.log("PD final: ", parsedResult);
              resolve(parsedResult);

            }).catch(reject);

        }

      }

    });

  };

};
