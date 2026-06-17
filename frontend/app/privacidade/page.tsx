import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — Produção na Mão",
  description: "Como coletamos, usamos e protegemos seus dados — em conformidade com a LGPD (Lei 13.709/2018)",
};

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-400 mb-2">Última atualização: junho de 2026</p>
        <p className="text-sm text-gray-500 mb-10">
          Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018</strong>
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-10 text-sm text-gray-700">
          <strong>Resumo em linguagem simples:</strong> Coletamos apenas os dados necessários para
          operar o serviço. Não vendemos seus dados a terceiros. Você pode solicitar acesso,
          correção ou exclusão dos seus dados a qualquer momento.
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quem somos (Controlador de Dados)</h2>
            <p>
              A <strong>Produção na Mão Tecnologia Ltda.</strong> ("Empresa", "nós") é a controladora dos
              dados pessoais tratados nesta plataforma.
            </p>
            <ul className="list-none mt-3 space-y-1 ml-4">
              <li><strong>Encarregado (DPO):</strong> privacidade@producaonamao.com.br</li>
              <li><strong>Site:</strong> producaonamao.com.br</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados que coletamos</h2>
            <p>Coletamos apenas os dados necessários para a prestação do serviço:</p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Dados fornecidos pelo Usuário</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Nome completo e nome do estabelecimento</li>
              <li>Endereço de e-mail e senha (armazenada em hash bcrypt)</li>
              <li>Número de WhatsApp (opcional)</li>
              <li>Dados de fichas técnicas, insumos e produtos cadastrados</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Dados coletados automaticamente</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Logs de acesso (IP, data/hora, ação realizada) — para segurança e auditoria</li>
              <li>Token de sessão (JWT armazenado no localStorage do navegador)</li>
              <li>Dados de uso agregados para melhoria do serviço (sem identificação individual)</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Dados de pagamento</h3>
            <p>
              Não armazenamos dados de cartão de crédito ou dados bancários. Esses dados são
              tratados exclusivamente pela plataforma <strong>Asaas</strong> (processador de
              pagamentos), com suas próprias políticas de privacidade e certificação PCI-DSS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalidades do tratamento</h2>
            <p>Tratamos seus dados para as seguintes finalidades:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left border border-gray-200 px-3 py-2 font-semibold">Finalidade</th>
                    <th className="text-left border border-gray-200 px-3 py-2 font-semibold">Base legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Criação e gestão da conta", "Execução de contrato (Art. 7º, V)"],
                    ["Prestação do serviço SaaS", "Execução de contrato (Art. 7º, V)"],
                    ["Processamento de pagamentos", "Execução de contrato (Art. 7º, V)"],
                    ["Envio de faturas e avisos", "Execução de contrato (Art. 7º, V)"],
                    ["Suporte técnico", "Execução de contrato (Art. 7º, V)"],
                    ["Audit log e segurança", "Legítimo interesse / cumprimento de obrigação legal (Art. 7º, II e IX)"],
                    ["Comunicações de marketing", "Consentimento (Art. 7º, I) — você pode cancelar a qualquer momento"],
                    ["Melhoria do produto", "Legítimo interesse (Art. 7º, IX), com dados anonimizados"],
                  ].map(([fin, base]) => (
                    <tr key={fin} className="border-b border-gray-100">
                      <td className="border border-gray-200 px-3 py-2">{fin}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-500">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
            <p>
              <strong>Não vendemos seus dados pessoais.</strong> Compartilhamos apenas nas
              situações abaixo e sempre com as salvaguardas adequadas:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>
                <strong>Asaas</strong> — processamento de cobranças. Dados mínimos necessários
                (nome, e-mail, CPF/CNPJ quando necessário para emissão de boleto).
              </li>
              <li>
                <strong>Railway e Vercel</strong> — infraestrutura de hospedagem (servidores
                localizados nos EUA com cláusulas contratuais padrão adequadas).
              </li>
              <li>
                <strong>Anthropic Claude API</strong> — para o recurso "Chef Consultor IA".
                Apenas o conteúdo da mensagem enviada é compartilhado; não são enviados dados
                pessoais identificáveis sem necessidade.
              </li>
              <li>
                <strong>Autoridades governamentais</strong> — quando exigido por lei ou ordem judicial.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Retenção de dados</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Conta ativa:</strong> dados mantidos enquanto o Usuário tiver conta ativa.
              </li>
              <li>
                <strong>Após cancelamento:</strong> dados mantidos por 30 dias para possibilitar
                eventual reativação. Após esse prazo, são excluídos definitivamente.
              </li>
              <li>
                <strong>Logs de auditoria:</strong> mantidos por 12 meses por obrigação legal.
              </li>
              <li>
                <strong>Dados fiscais / contábeis:</strong> mantidos pelo prazo legal exigido
                (mínimo 5 anos conforme legislação tributária).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Segurança dos dados</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 ml-4">
              <li>Senhas armazenadas com hash bcrypt (jamais em texto claro)</li>
              <li>Comunicação criptografada via HTTPS/TLS em todos os endpoints</li>
              <li>Tokens de autenticação com expiração automática</li>
              <li>Audit log completo de todas as operações sensíveis</li>
              <li>Acesso à base de dados restrito ao ambiente de produção</li>
              <li>Backups regulares com controle de acesso</li>
            </ul>
            <p className="mt-3">
              Em caso de incidente de segurança que possa afetar seus dados, notificaremos a
              ANPD e os titulares afetados no prazo estabelecido pela LGPD (72 horas).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Seus direitos como titular (LGPD Art. 18)</h2>
            <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Confirmação e acesso:</strong> saber quais dados temos sobre você</li>
              <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização ou exclusão:</strong> de dados desnecessários ou tratados com consentimento</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado (CSV/JSON)</li>
              <li><strong>Revogação do consentimento:</strong> para as finalidades baseadas em consentimento</li>
              <li><strong>Oposição:</strong> ao tratamento baseado em legítimo interesse</li>
              <li><strong>Exclusão da conta:</strong> e de todos os dados associados</li>
            </ul>
            <p className="mt-4">
              Para exercer qualquer direito, envie um e-mail para{" "}
              <strong>privacidade@producaonamao.com.br</strong> com o assunto
              "Direitos LGPD — [seu nome]". Responderemos em até 15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies e armazenamento local</h2>
            <p>
              A plataforma não utiliza cookies de rastreamento ou publicidade. Utilizamos
              apenas <strong>localStorage</strong> do navegador para armazenar o token de
              autenticação JWT, que é removido automaticamente ao encerrar a sessão ou
              expirar o prazo de validade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Transferência internacional de dados</h2>
            <p>
              Parte da infraestrutura (Railway, Vercel, Anthropic API) opera fora do Brasil,
              nos Estados Unidos. Garantimos que essas transferências ocorram com cláusulas
              contratuais padrão ou outros mecanismos adequados conforme exigido pela LGPD
              (Art. 33).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Menores de idade</h2>
            <p>
              O Serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente
              dados pessoais de menores. Se tomarmos conhecimento de que coletamos dados de
              uma pessoa menor de 18 anos, excluiremos tais dados imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada periodicamente. Quando ocorrerem alterações
              significativas, notificaremos os Usuários por e-mail ou aviso no painel com
              antecedência mínima de 15 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contato e DPO</h2>
            <p>Para questões de privacidade e proteção de dados:</p>
            <ul className="list-none mt-2 space-y-1 ml-4">
              <li><strong>Encarregado (DPO):</strong> privacidade@producaonamao.com.br</li>
              <li><strong>Contato geral:</strong> contato@producaonamao.com.br</li>
              <li><strong>ANPD:</strong> <span className="text-gray-500">gov.br/anpd</span> (Autoridade Nacional de Proteção de Dados)</li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2026 Produção na Mão · LGPD em conformidade</span>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-gray-600">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-gray-600">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
