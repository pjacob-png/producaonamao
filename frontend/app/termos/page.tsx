import Link from "next/link";

export const metadata = {
  title: "Termos de Uso — Produção na Mão",
  description: "Termos e condições de uso da plataforma Produção na Mão",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-xl">🍳</span> Produção na Mão
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-400 mb-10">Última atualização: junho de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma <strong>Produção na Mão</strong> ("Serviço"), você ("Usuário")
              concorda com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar
              com qualquer parte destes termos, não utilize o Serviço.
            </p>
            <p className="mt-3">
              O Serviço é operado por <strong>Produção na Mão Tecnologia Ltda.</strong>, inscrita no CNPJ
              sob o nº a ser informado, com sede no Brasil ("Empresa").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p>
              O Produção na Mão é uma plataforma SaaS (Software como Serviço) destinada à gestão de
              fichas técnicas, cálculo de CMV (Custo da Mercadoria Vendida), precificação com markup
              e relatórios operacionais para estabelecimentos do setor de alimentação.
            </p>
            <p className="mt-3">Funcionalidades disponíveis conforme o plano contratado:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Cadastro de insumos e fichas técnicas</li>
              <li>Cálculo automático de CMV e markup</li>
              <li>Consultor IA especializado em gastronomia</li>
              <li>Integração com WhatsApp para envio de fichas</li>
              <li>Integração com sistemas ERP</li>
              <li>Relatórios e curva ABC</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cadastro e Conta</h2>
            <p>
              Para utilizar o Serviço, você deve criar uma conta fornecendo informações verdadeiras,
              precisas e completas. Você é responsável por manter a confidencialidade de suas credenciais
              de acesso e por todas as atividades realizadas em sua conta.
            </p>
            <p className="mt-3">
              Ao criar uma conta, você declara ter pelo menos 18 anos de idade ou possuir autorização
              legal para representar a empresa cadastrada.
            </p>
            <p className="mt-3">
              A Empresa reserva-se o direito de suspender ou encerrar contas que violem estes Termos,
              sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Planos e Pagamentos</h2>
            <p>
              O Serviço oferece um período de avaliação gratuita de <strong>14 (quatorze) dias</strong>,
              sem necessidade de cartão de crédito. Após o período de avaliação, a continuidade do
              acesso requer a contratação de um dos planos pagos.
            </p>
            <p className="mt-3">Os planos disponíveis e seus preços são:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Básico:</strong> R$ 99,00/mês</li>
              <li><strong>Pro:</strong> R$ 199,00/mês</li>
              <li><strong>Rede:</strong> R$ 399,00/mês</li>
            </ul>
            <p className="mt-3">
              Os pagamentos são processados pela plataforma <strong>Asaas</strong>, podendo ser
              realizados via Boleto Bancário, PIX ou Cartão de Crédito. A Empresa não armazena
              dados de pagamento — estes são gerenciados exclusivamente pela Asaas.
            </p>
            <p className="mt-3">
              Os valores poderão ser reajustados anualmente com base no IGPM ou índice equivalente,
              mediante comunicação prévia de 30 (trinta) dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cancelamento e Reembolso</h2>
            <p>
              O Usuário pode cancelar sua assinatura a qualquer momento através do painel de
              configurações. O acesso ao Serviço será mantido até o fim do período pago.
              Não há reembolso proporcional para cancelamentos no meio do ciclo de faturamento.
            </p>
            <p className="mt-3">
              Em caso de cancelamento, os dados do Usuário serão mantidos por <strong>30 (trinta) dias</strong>,
              após os quais poderão ser excluídos definitivamente. O Usuário pode solicitar a exclusão
              imediata dos dados a qualquer momento, conforme descrito na Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Uso Aceitável</h2>
            <p>O Usuário concorda em não utilizar o Serviço para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Violar qualquer lei ou regulamento aplicável</li>
              <li>Transmitir conteúdo ilegal, fraudulento ou prejudicial</li>
              <li>Tentar acessar sistemas ou dados de outros usuários sem autorização</li>
              <li>Sobrecarregar intencionalmente a infraestrutura do Serviço</li>
              <li>Realizar engenharia reversa ou copiar o código-fonte da plataforma</li>
              <li>Revender ou sublicenciar o acesso ao Serviço sem autorização expressa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma, incluindo mas não limitado a código-fonte, design,
              logotipos, textos e funcionalidades, é de propriedade exclusiva da Empresa ou de seus
              licenciadores e protegido por leis de propriedade intelectual.
            </p>
            <p className="mt-3">
              Os dados inseridos pelo Usuário (fichas técnicas, insumos, produtos etc.) pertencem
              ao Usuário. A Empresa não reivindica propriedade sobre o conteúdo do Usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disponibilidade e Suporte</h2>
            <p>
              A Empresa envidará esforços razoáveis para manter o Serviço disponível 24 horas por dia,
              7 dias por semana. No entanto, não garante disponibilidade ininterrupta e não se
              responsabiliza por indisponibilidades causadas por fatores fora de seu controle,
              incluindo falhas de provedores de infraestrutura, ataques cibernéticos ou casos de força maior.
            </p>
            <p className="mt-3">
              O suporte técnico é prestado por e-mail em <strong>suporte@producaonamao.com.br</strong>,
              com prazo de resposta de até 2 dias úteis para o plano Básico e 1 dia útil para os
              planos Pro e Rede.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitação de Responsabilidade</h2>
            <p>
              O Serviço é fornecido "como está" e "conforme disponível". A Empresa não oferece garantias
              de que o Serviço atenderá a todos os requisitos do Usuário ou que estará livre de erros.
            </p>
            <p className="mt-3">
              Em nenhuma hipótese a Empresa será responsável por danos indiretos, incidentais, especiais
              ou consequentes, incluindo perda de lucros, dados ou oportunidades de negócio, mesmo que
              tenha sido avisada da possibilidade de tais danos.
            </p>
            <p className="mt-3">
              A responsabilidade total da Empresa, em qualquer circunstância, ficará limitada ao valor
              pago pelo Usuário nos últimos 3 meses de serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Alterações nos Termos</h2>
            <p>
              A Empresa reserva-se o direito de modificar estes Termos a qualquer momento. Alterações
              significativas serão comunicadas com antecedência mínima de 15 (quinze) dias por e-mail
              ou através de aviso no painel do Usuário.
            </p>
            <p className="mt-3">
              O uso continuado do Serviço após a entrada em vigor das alterações constitui aceitação
              dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Foro e Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
              foro da Comarca de São Paulo/SP para dirimir quaisquer litígios decorrentes deste
              instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos, entre em contato:
            </p>
            <ul className="list-none mt-2 space-y-1 ml-4">
              <li><strong>E-mail:</strong> contato@producaonamao.com.br</li>
              <li><strong>Suporte:</strong> suporte@producaonamao.com.br</li>
              <li><strong>Site:</strong> producaonamao.com.br</li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2026 Produção na Mão</span>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-gray-600">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-gray-600">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
