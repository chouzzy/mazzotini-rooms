
const whatsappNumber = 5511981966423
const email = `contato@awer.co`
const instagram = `https://www.instagram.com/mazzotiniadvogados/?hl=pt`



const mapsLink = "https://www.google.com/maps/place/Av.+Prof.+Othon+Gama+D'E%C3%A7a,+677+-+Centro,+Florian%C3%B3polis+-+SC,+88015-240/@-27.589685,-48.5521411,986m/data=!3m2!1e3!4b1!4m6!3m5!1s0x95273818ef44cf45:0x820c90460fe96ac6!8m2!3d-27.589685!4d-48.5521411!16s%2Fg%2F11c51w2ntx?entry=ttu&g_ep=EgoyMDI1MDMxMi4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D"
export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD") // Normaliza a string, separando letras e acentos
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
        .replace(/\s+/g, '-')           // Substitui espaços por hífens
        .replace(/[^\w\-]+/g, '')       // Remove caracteres não alfanuméricos, exceto hífen
        .replace(/\-\-+/g, '-')         // Substitui múltiplos hífens por um único hífen
        .replace(/^-+/, '')             // Remove hífens do início
        .replace(/-+$/, '');            // Remove hífens do final
}


const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Elemento com ID "${id}" não encontrado.`);
    }
};

const whatsappLink = (path?: string) => {

    const text = "Olá, acessei o Sistema Mazzotini e preciso de ajuda."
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
}

const instagramLink = (path?: string) => {

    return `${email}`
}

const mailLink = (path?: string) => {

    return `mailto:${email}`
}

const extractFreeText = (description: string | null | undefined): string => {
    if (!description) return "Atualização de Valor";

    // Se não for um andamento padronizado, retorna o texto original.
    if (!description.includes('#RelatórioMAA')) {
        return description;
    }

    // Encontra a última linha de valor (ex: "Valor Atualizado: R$ ...")
    const lastValueIndex = description.lastIndexOf('R$');
    if (lastValueIndex === -1) {
        return description.substring(description.indexOf('#RelatórioMAA') + 3).trim();
    }
    
    // Encontra a próxima quebra de linha após o último valor
    const textStartIndex = description.indexOf('\n', lastValueIndex);
    
    // Se não houver texto após os valores, retorna um texto genérico
    if (textStartIndex === -1) {
        return "Atualização de valores do processo";
    }
    
    // Retorna o texto que vem depois, limpando espaços em branco
    return description.substring(textStartIndex).trim();
};


export { scrollToSection, whatsappLink, whatsappNumber, mapsLink, instagramLink, mailLink, extractFreeText }