const axios = require('axios');

// Function to identify the pattern of the accession number
function identifyAccessionNumberPattern(text) {
  // Regular expression pattern to match accession numbers
  const pattern = /\b([A-Z]{1,2}\d{5,}|\w{2,}\d{6,})\b/g;
  
  // Extract accession numbers from the text
  const matches = text.match(pattern);
  
  // Return the unique accession numbers
  if (matches) {
    return [...new Set(matches)];
  }
  
  return [];
}


// Function to construct the XML tag for the accession number
function constructXmlTag(accessionNumber, prefix ,resolvedUrl) {
  const xmlTag = `<ext-link ext-link-type="uri" assigning-authority="${prefix}" xlink:href="${resolvedUrl}">${accessionNumber}</ext-link>`;
  return xmlTag;
}

// Function to fetch the namespace information and URL for the accession number
async function fetchNamespaceInfo(accessionNumber) {
    const registryUrl = 'https://registry.api.identifiers.org/restApi/namespaces?page=0&size=822';
  
    try {
      // Fetch the namespace registry
      const response = await axios.get(registryUrl);
      const namespaces = response.data._embedded.namespaces;
  
      // Find the matching namespace for the accession number
      const namespace = namespaces.find((ns) =>
        accessionNumber.match(ns.pattern)
      );
  
      if (namespace) {
        // Construct the compact identifier
        const compactIdentifier = `${namespace.prefix}:${namespace.sampleId}`;
  
        // Fetch the compact identifier resolved URL
        const resolvedUrl = `https://resolver.api.identifiers.org/${compactIdentifier}`;
  
        // Fetch the namespace registry
        const compactIdentifierResponse = await axios.get(resolvedUrl);
        const compactIdentifierData = compactIdentifierResponse.data.payload.resolvedResources;

        var compactIdentifiervalue = compactIdentifierData.find((ns) =>
        ns.location.countryCode == 'US'
      );

      if(!compactIdentifiervalue){
        var compactIdentifiervalue = compactIdentifierData.find((ns) =>
        ns.providerCode ='CURATOR_REVIEW'
      );
      }

        // Return the namespace and resolved URL
        return [namespace.prefix, compactIdentifiervalue.resourceHomeUrl+"/"+accessionNumber];
      }
    } catch (error) {
      console.error('Error fetching namespace information:', error.message);
    }
  
    return null;
  }

// Example usage
const inputText = `
The complete genome sequences were deposited in National Center for Biotechnology
Information (NCBI) under the accession number CP110363
(https://www.ncbi.nlm.nih.gov/nuccore/CP110363). The raw sequences obtained from Nanopore
PromethION sequencer were deposited in the Sequence Read Archive under the BioProject
PRJNA895949 (https://www.ncbi.nlm.nih.gov/bioproject/PRJNA895949). The raw sequences
obtained from DNBSEQ-T7RS platform were deposited in the Sequence Read Archive under
the BioProject PRJNA898672 (https://www.ncbi.nlm.nih.gov/bioproject/PRJNA898672).



`;

// Identify accession numbers in the input text
const accessionNumbers = identifyAccessionNumberPattern(inputText);

if (accessionNumbers.length > 0) {
  accessionNumbers.forEach(async accessionNumber => {
    // Fetch namespace information for each accession number
    const namespaceInfo = await fetchNamespaceInfo(accessionNumber);
    
    if (namespaceInfo) {
      // Construct the XML tag
      const xmlTag = constructXmlTag(accessionNumber,namespaceInfo[0], namespaceInfo[1]);
      
      //Print the accession number with the XML tag
      console.log(xmlTag);
    }
  });
} else {
  console.log('No accession numbers found in the input text.');
}
