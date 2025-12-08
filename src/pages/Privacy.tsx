import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import portellaLogo from "@/assets/portella-logo.png";

const Privacy = () => {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Informações que Coletamos</h2>
              <p>Coletamos as seguintes categorias de informações:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Informações de cadastro:</strong> email, nome de usuário, nome de exibição e senha.
                </li>
                <li>
                  <strong>Informações de perfil:</strong> foto, biografia, música de fundo e outras 
                  personalizações que você escolhe adicionar.
                </li>
                <li>
                  <strong>Conteúdo:</strong> posts, comentários, mensagens, fotos e vídeos que você compartilha.
                </li>
                <li>
                  <strong>Dados de uso:</strong> informações sobre como você interage com a plataforma.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">2. Como Usamos suas Informações</h2>
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer e melhorar nossos serviços.</li>
                <li>Personalizar sua experiência na plataforma.</li>
                <li>Permitir a comunicação entre usuários.</li>
                <li>Garantir a segurança e integridade da plataforma.</li>
                <li>Enviar notificações relevantes sobre atividades em sua conta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">3. Compartilhamento de Informações</h2>
              <p>
                Não vendemos suas informações pessoais. Podemos compartilhar dados com:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Outros usuários, conforme suas configurações de privacidade.</li>
                <li>Prestadores de serviços que nos ajudam a operar a plataforma.</li>
                <li>Autoridades legais, quando exigido por lei.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">4. Suas Configurações de Privacidade</h2>
              <p>Você pode controlar:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Quem pode ver suas publicações (todos, vizinhos, amigos da varanda).</li>
                <li>Quem pode enviar solicitações de amizade.</li>
                <li>Bloquear usuários específicos para esconder seu perfil deles.</li>
                <li>Quem pode enviar mensagens privadas (baseado no nível de amizade).</li>
              </ul>
              <p className="mt-2">
                Acesse as{' '}
                <Link to="/privacy-settings" className="text-primary hover:underline">
                  Configurações de Privacidade
                </Link>
                {' '}para gerenciar essas opções.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas técnicas e organizacionais para proteger suas informações, 
                incluindo criptografia de dados em trânsito e políticas de acesso restrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">6. Retenção de Dados</h2>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, 
                seus dados pessoais serão removidos, exceto quando a retenção for necessária 
                por obrigações legais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">7. Seus Direitos</h2>
              <p>De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acessar seus dados pessoais.</li>
                <li>Corrigir dados incompletos ou incorretos.</li>
                <li>Solicitar a exclusão de seus dados.</li>
                <li>Revogar consentimentos previamente dados.</li>
                <li>Solicitar a portabilidade de seus dados.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">8. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies e tecnologias similares para manter você conectado e 
                melhorar sua experiência. Você pode gerenciar as preferências de cookies 
                nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">9. Menores de Idade</h2>
              <p>
                O Portella não é destinado a menores de 13 anos. Se tomarmos conhecimento 
                de que coletamos dados de crianças menores de 13 anos, tomaremos medidas 
                para excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">10. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. 
                Notificaremos sobre alterações significativas através da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">11. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
                entre em contato através da Prefeitura do Portella ou pelos canais 
                oficiais de suporte.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/terms">Ver Termos de Uso</Link>
            </Button>
            <Button asChild>
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;