import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import portellaLogo from "@/assets/portella-logo.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <img src={portellaLogo} alt="Portella" className="h-10" />
        </div>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-orkut rounded-full">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Termos de Uso</h1>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o Portella, você concorda em cumprir estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">2. Descrição do Serviço</h2>
              <p>
                O Portella é uma rede social que permite aos usuários criar perfis ("Casas Virtuais"), 
                conectar-se com outros usuários, participar de comunidades ("Clubes"), compartilhar 
                conteúdo e interagir de diversas formas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">3. Cadastro e Conta</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Você deve ter pelo menos 13 anos para usar o Portella.</li>
                <li>As informações fornecidas no cadastro devem ser verdadeiras e precisas.</li>
                <li>Você é responsável por manter a segurança de sua senha e conta.</li>
                <li>Não é permitido criar múltiplas contas ou compartilhar sua conta com terceiros.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">4. Conduta do Usuário</h2>
              <p>Ao usar o Portella, você concorda em NÃO:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros.</li>
                <li>Assediar, ameaçar ou intimidar outros usuários.</li>
                <li>Compartilhar conteúdo sexual envolvendo menores ou conteúdo explícito não consensual.</li>
                <li>Usar o serviço para spam, phishing ou atividades fraudulentas.</li>
                <li>Tentar acessar contas de outros usuários ou sistemas do Portella.</li>
                <li>Violar qualquer lei aplicável.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">5. Conteúdo do Usuário</h2>
              <p>
                Você mantém os direitos sobre o conteúdo que publica, mas concede ao Portella uma 
                licença para exibir, distribuir e usar esse conteúdo dentro da plataforma. 
                O Portella pode remover conteúdo que viole estes termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">6. Privacidade</h2>
              <p>
                O uso de suas informações pessoais é regido por nossa{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
                , que faz parte integrante destes Termos de Uso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">7. Moderação</h2>
              <p>
                O Portella possui um sistema de moderação comunitária ("Delegacia") que pode 
                revisar denúncias e tomar ações, incluindo a remoção de conteúdo e suspensão 
                de contas que violem estes termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">8. Encerramento de Conta</h2>
              <p>
                O Portella pode suspender ou encerrar sua conta a qualquer momento por violação 
                destes termos. Você pode excluir sua conta a qualquer momento através das configurações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">9. Isenção de Garantias</h2>
              <p>
                O serviço é fornecido "como está", sem garantias de qualquer tipo. Não garantimos 
                que o serviço estará sempre disponível ou livre de erros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">10. Alterações nos Termos</h2>
              <p>
                Podemos atualizar estes termos periodicamente. Notificaremos os usuários sobre 
                mudanças significativas. O uso continuado do serviço após alterações constitui 
                aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">11. Contato</h2>
              <p>
                Para dúvidas sobre estes Termos de Uso, entre em contato através da 
                Prefeitura do Portella ou pelos canais oficiais de suporte.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-center">
            <Button asChild>
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;