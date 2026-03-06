import { Flex, Link } from "@chakra-ui/react";
import { BsWhatsapp } from "react-icons/bs";
import { whatsappLink } from "@/utils";


export default function WhatsButton() {
    
    return (
        <Link className="zap-tag" target={'_blank'} href={whatsappLink()}>
        
        <Flex zIndex={1} bg='#25D366' color="#fffafa"
        fontSize='1.8rem' borderRadius={'full'} p={4} 
        position='fixed'bottom={8} right={8}
        _hover={{ transition:' 400ms', fontSize:'2.4rem'}}
        cursor='pointer'>
            <BsWhatsapp/>
        </Flex>
        </Link>
    )
}
