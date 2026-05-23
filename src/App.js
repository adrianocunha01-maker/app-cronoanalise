import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell, LabelList } from 'recharts';
import './index.css';

// ===========================================================================
// FUNÇÕES MATEMÁTICAS E ESTATÍSTICAS
// ===========================================================================
const calcularMedia = (arr) => {
  const validos = arr.filter(v => v !== '' && Number(v) > 0).map(Number);
  if (validos.length === 0) return 0;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
};
const calcularDesvioPadrao = (arr, media) => {
  const validos = arr.filter(v => v !== '' && Number(v) > 0).map(Number);
  if (validos.length <= 1) return 0;
  const variancia = validos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / (validos.length - 1);
  return Math.sqrt(variancia);
};
const removerOutliersZScore = (arr, threshold = 2.0) => {
  const validos = arr.filter(v => v !== '' && Number(v) > 0).map(Number);
  if (validos.length < 3) return validos; 
  const media = calcularMedia(validos);
  const desvio = calcularDesvioPadrao(validos, media);
  if (desvio === 0) return validos;
  return validos.filter(v => Math.abs((v - media) / desvio) <= threshold);
};

// ===========================================================================
// APP PRINCIPAL
// ===========================================================================
export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('novaCrono'); 
  const [telaAtual, setTelaAtual] = useState('setup');
  const [qtdAmostras, setQtdAmostras] = useState(5);
  const [postoSelecionado, setPostoSelecionado] = useState(null); 
  
  // Controle da Tela de Histórico
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [estudoSelecionadoHistorico, setEstudoSelecionadoHistorico] = useState(null);

  // ===========================================================================
  // BANCO DE DADOS MASTER (Cadastros)
  // ===========================================================================
  const [responsaveisDB, setResponsaveisDB] = useState([
    { id: 1, nome: 'Adriano Cunha', cargo: 'Engenheiro de Processos' },
    { id: 2, nome: 'Marina Costa', cargo: 'Analista Lean' }
  ]);
  const [produtosDB, setProdutosDB] = useState([
    { id: 1, nome: 'Placa Controladora XR-200', pn: 'PCB-XR200-V2', versao: 'V2', familia: 'PCBA', fase: 'Corrente' },
    { id: 2, nome: 'Módulo Conversor 48V', pn: 'MOD-48V-310', versao: 'V1', familia: 'Fonte', fase: 'NPI' }
  ]);

  const [novoResponsavel, setNovoResponsavel] = useState({ nome: '', cargo: '' });
  const [novoProduto, setNovoProduto] = useState({ nome: '', pn: '', versao: '', familia: '', fase: 'NPI' });

  // ===========================================================================
  // ESTADOS DA CRONOANÁLISE (O ESTUDO ATUAL)
  // ===========================================================================
  const [listaHistorico, setListaHistorico] = useState([]);

  const [turnos, setTurnos] = useState([
    { id: 1, nome: "1º Turno", horas: 7.33, ativo: true },
    { id: 2, nome: "2º Turno", horas: 7.25, ativo: false },
    { id: 3, nome: "3º Turno", horas: 6.42, ativo: false },
  ]);

  const [estudo, setEstudo] = useState({
    produtoSelecionado: '', responsavelSelecionado: '', 
    qtdPostos: 4, headcountTotal: 4, demanda: 480, taktPlanejado: '', concessaoGeral: 10
  });

  const [postos, setPostos] = useState([
    {
      id: Date.now(), nome: 'Posto 01', ritmo: 100, tolerancia: 15, operadores: 1,
      tarefas: [{ id: Date.now() + 1, descricao: '', classificacao: 'VA', ciclos: Array(5).fill('') }]
    }
  ]);

  const tempoDisponivelSeg = Math.round(turnos.filter(t => t.ativo).reduce((a, t) => a + t.horas, 0) * 3600);
  const totalHorasAtivas = turnos.filter(t => t.ativo).reduce((a, t) => a + t.horas, 0);
  const taktCalculado = estudo.demanda > 0 ? (tempoDisponivelSeg / estudo.demanda) : 0;
  const taktFinal = Number(estudo.taktPlanejado) > 0 ? Number(estudo.taktPlanejado) : taktCalculado;

  // ===========================================================================
  // FUNÇÕES CORE (Salvar, Carregar, Editar)
  // ===========================================================================
  const getProdutoAtual = () => produtosDB.find(p => p.id === Number(estudo.produtoSelecionado)) || { nome: 'Nenhum Produto', pn: '' };
  const getResponsavelAtual = () => responsaveisDB.find(r => r.id === Number(estudo.responsavelSelecionado)) || { nome: 'Desconhecido' };

  const salvarEstudoNoHistorico = (kpis) => {
    const produtoInfo = getProdutoAtual();
    const responsavelInfo = getResponsavelAtual();

    const novoRegistro = {
      id: Date.now(), 
      dataHora: new Date().toLocaleString('pt-BR'),
      produtoNome: produtoInfo.nome,
      pn: produtoInfo.pn,
      fase: produtoInfo.fase,
      responsavelNome: responsavelInfo.nome,
      eficiencia: kpis.eficiencia,
      gargalo: kpis.gargalo,
      snapshot: {
        estudo: JSON.parse(JSON.stringify(estudo)),
        postos: JSON.parse(JSON.stringify(postos)),
        turnos: JSON.parse(JSON.stringify(turnos)),
        qtdAmostras: qtdAmostras
      }
    };
    setListaHistorico([novoRegistro, ...listaHistorico]);
    alert("✅ Estudo salvo com sucesso no Histórico!");
    setEstudoSelecionadoHistorico(novoRegistro); // Já abre a visualização
    setAbaAtiva('historico');
  };

  const carregarParaNovaRevisao = (registro) => {
    setEstudo(registro.snapshot.estudo);
    setPostos(registro.snapshot.postos);
    setTurnos(registro.snapshot.turnos);
    setQtdAmostras(registro.snapshot.qtdAmostras);
    
    setEstudoSelecionadoHistorico(null); // Fecha a visualização do histórico
    setAbaAtiva('novaCrono');
    setTelaAtual('coleta'); // Vai para a tela de coleta para o analista editar os tempos novos
  };

  // ===========================================================================
  // HANDLERS DE EDIÇÃO DA CRONOANÁLISE
  // ===========================================================================
  const toggleTurno = (id) => setTurnos(turnos.map(t => t.id === id ? { ...t, ativo: !t.ativo } : t));
  const alterarHorasTurno = (id, horas) => setTurnos(turnos.map(t => t.id === id ? { ...t, horas: Number(horas) } : t));
  const alterarQtdAmostras = (novaQtd) => {
    setQtdAmostras(novaQtd);
    setPostos(postos.map(p => ({ ...p, tarefas: p.tarefas.map(t => {
        const novos = [...t.ciclos];
        if (novaQtd > novos.length) while (novos.length < novaQtd) novos.push('');
        else novos.length = novaQtd;
        return { ...t, ciclos: novos };
      })
    })));
  };
  const adicionarPosto = () => setPostos([...postos, { id: Date.now(), nome: `Posto 0${postos.length + 1}`, ritmo: 100, tolerancia: 15, operadores: 1, tarefas: [{ id: Date.now() + 1, descricao: '', classificacao: 'VA', ciclos: Array(qtdAmostras).fill('') }] }]);
  const adicionarTarefa = (pIdx) => { const n = [...postos]; n[pIdx].tarefas.push({ id: Date.now(), descricao: '', classificacao: 'VA', ciclos: Array(qtdAmostras).fill('') }); setPostos(n); };
  const atualizarPosto = (pIdx, c, v) => { const n = [...postos]; n[pIdx][c] = v; setPostos(n); };
  const atualizarTarefa = (pIdx, tIdx, c, v, cIdx = null) => { const n = [...postos]; if(c === 'ciclo') n[pIdx].tarefas[tIdx].ciclos[cIdx] = v; else n[pIdx].tarefas[tIdx][c] = v; setPostos(n); };
  const deletarTarefa = (pIdx, tIdx) => { const n = [...postos]; n[pIdx].tarefas.splice(tIdx, 1); setPostos(n); };

  const getCorClassificacao = (tipo) => {
    if (tipo === 'VA') return 'bg-green-100 text-green-800 border-green-300';
    if (tipo === 'NNVA') return 'bg-yellow-100 text-yellow-800 border-yellow-400';
    if (tipo === 'NVA') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100';
  };

  const cadastrarResponsavel = () => { setResponsaveisDB([...responsaveisDB, { id: Date.now(), ...novoResponsavel }]); setNovoResponsavel({ nome: '', cargo: '' }); };
  const cadastrarProduto = () => { setProdutosDB([...produtosDB, { id: Date.now(), ...novoProduto }]); setNovoProduto({ nome: '', pn: '', versao: '', familia: '', fase: 'NPI' }); };

  // ===========================================================================
  // TELA 1: SETUP E COLETA
  // ===========================================================================
  const renderSetup = () => (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-600 mt-6 mb-10">
      <div className="mb-8 border-b pb-4">
        <h2 className="text-3xl font-bold mt-2 text-gray-800">Setup do Estudo</h2>
        <p className="text-gray-500 text-sm">Defina os parâmetros globais da linha.</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
        <h3 className="font-bold text-gray-800 mb-4">Turnos de Trabalho</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {turnos.map(t => (
            <div key={t.id} className={`p-4 rounded-lg border-2 transition-all ${t.ativo ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={t.ativo} onChange={() => toggleTurno(t.id)} className="w-5 h-5 cursor-pointer" />
                <span className="font-bold text-sm">{t.nome}</span>
              </div>
              <input type="number" step="0.01" value={t.horas} disabled={!t.ativo} onChange={(e) => alterarHorasTurno(t.id, e.target.value)} className="w-full p-2 border rounded text-sm disabled:bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Produto / Projeto (Master Data)</label>
          <select value={estudo.produtoSelecionado} onChange={e => setEstudo({...estudo, produtoSelecionado: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 font-semibold">
            <option value="">-- Selecione o Produto --</option>
            {produtosDB.map(p => <option key={p.id} value={p.id}>{p.pn} - {p.nome} ({p.fase})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Responsável pela Medição</label>
          <select value={estudo.responsavelSelecionado} onChange={e => setEstudo({...estudo, responsavelSelecionado: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 font-semibold">
            <option value="">-- Selecione o Responsável --</option>
            {responsaveisDB.map(r => <option key={r.id} value={r.id}>{r.nome} - {r.cargo}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1">Postos de Trabalho</label><input type="number" value={estudo.qtdPostos} onChange={e => setEstudo({...estudo, qtdPostos: Number(e.target.value)})} className="w-full p-3 border rounded-lg" /></div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1">Demanda Diária</label><input type="number" value={estudo.demanda} onChange={e => setEstudo({...estudo, demanda: Number(e.target.value)})} className="w-full p-3 border rounded-lg" /></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg">
          <label className="block text-sm font-bold text-sky-800 mb-2">Takt Time Calc.</label>
          <p className="text-3xl font-black text-sky-600">{taktCalculado > 0 ? taktCalculado.toFixed(2) : '—'} <span className="text-sm font-normal">s</span></p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <label className="block text-sm font-bold text-gray-700 mb-2">Takt Planejado (editável)</label>
          <input type="number" placeholder={taktCalculado.toFixed(2)} value={estudo.taktPlanejado} onChange={e => setEstudo({...estudo, taktPlanejado: e.target.value})} className="w-full p-2 border rounded text-lg font-bold bg-yellow-50" />
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <label className="block text-sm font-bold text-green-800 mb-2">Concessão NR-17</label>
          <div className="relative mb-2">
            <input type="number" min="0" max="20" value={estudo.concessaoGeral} onChange={e => setEstudo({...estudo, concessaoGeral: Math.min(20, Math.max(0, Number(e.target.value)))})} className="w-full p-2 border border-green-300 rounded bg-white text-lg font-bold text-green-800" />
            <span className="absolute right-3 top-2 text-green-600 font-bold">%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <button onClick={() => {
          if(!estudo.produtoSelecionado || !estudo.responsavelSelecionado) return alert("Selecione um Produto e um Responsável!");
          setTelaAtual('coleta');
        }} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow hover:bg-blue-700 transition">
          Avançar para Coleta (Grid) ➡️
        </button>
      </div>
    </div>
  );

  const renderColeta = () => (
    <div className="max-w-full px-6 mx-auto mt-4 mb-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Coleta de Tempos - {getProdutoAtual().nome}</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setTelaAtual('setup')} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold shadow hover:bg-gray-300 transition">⬅️ Voltar ao Setup</button>
          <button onClick={() => setTelaAtual('dashboard')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition">Gerar Yamazumi Lean 📊</button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <span className="font-bold text-gray-700 text-sm">Amostras por Tarefa:</span>
            <div className="flex gap-2">
            {[5, 10, 15, 20].map(num => (
                <button key={num} onClick={() => alterarQtdAmostras(num)} className={`px-4 py-1 rounded-full text-sm font-bold border transition ${qtdAmostras === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                {num} ciclos
                </button>
            ))}
            </div>
        </div>
      </div>

      {postos.map((posto, postoIndex) => (
        <div key={posto.id} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1"><label className="text-sm font-semibold text-gray-600">Posto</label><input type="text" value={posto.nome} onChange={(e) => atualizarPosto(postoIndex, 'nome', e.target.value)} className="w-full bg-gray-50 border p-2 rounded" /></div>
            <div className="w-24"><label className="text-sm font-semibold text-gray-600">Operadores</label><input type="number" value={posto.operadores} onChange={(e) => atualizarPosto(postoIndex, 'operadores', Number(e.target.value))} className="w-full border p-2 rounded text-center" /></div>
            <div className="w-24"><label className="text-sm font-semibold text-gray-600">Ritmo (%)</label><input type="number" value={posto.ritmo} onChange={(e) => atualizarPosto(postoIndex, 'ritmo', Number(e.target.value))} className="w-full border p-2 rounded text-center" /></div>
            <div className="w-32"><label className="text-sm font-semibold text-gray-600">Tolerância (%)</label><input type="number" value={posto.tolerancia} onChange={(e) => atualizarPosto(postoIndex, 'tolerancia', Number(e.target.value))} className="w-full border p-2 rounded text-center" /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 rounded-tl min-w-[200px]">Elemento da Operação</th>
                  <th className="p-2 w-28 text-center">Tipo (Lean)</th>
                  {Array.from({ length: qtdAmostras }).map((_, i) => (<th key={i} className="p-2 text-center w-16">C{i + 1}</th>))}
                  <th className="p-2 text-center bg-blue-700 w-24">T. Médio</th>
                  <th className="p-2 text-center bg-green-600 rounded-tr w-24">T. Padrão</th>
                  <th className="p-2 text-center w-10">❌</th>
                </tr>
              </thead>
              <tbody>
                {posto.tarefas.map((tarefa, tarefaIndex) => {
                  const ciclosLimpos = removerOutliersZScore(tarefa.ciclos);
                  const media = calcularMedia(ciclosLimpos);
                  const padrao = (media * (posto.ritmo / 100)) * (1 + (posto.tolerancia / 100));

                  return (
                    <tr key={tarefa.id} className="border-b hover:bg-gray-50 group">
                      <td className="p-1 border-r"><input type="text" value={tarefa.descricao} onChange={(e) => atualizarTarefa(postoIndex, tarefaIndex, 'descricao', e.target.value)} className="w-full p-1 bg-transparent outline-none" /></td>
                      <td className="p-1 border-r text-center">
                        <select value={tarefa.classificacao} onChange={(e) => atualizarTarefa(postoIndex, tarefaIndex, 'classificacao', e.target.value)} className={`w-full p-1 border font-bold text-xs rounded ${getCorClassificacao(tarefa.classificacao)}`}>
                          <option value="VA">VA</option><option value="NNVA">NNVA</option><option value="NVA">NVA</option>
                        </select>
                      </td>
                      {tarefa.ciclos.map((c, cicloIndex) => (
                        <td key={cicloIndex} className="p-1 border-r"><input type="number" value={c} onChange={(e) => atualizarTarefa(postoIndex, tarefaIndex, 'ciclo', e.target.value, cicloIndex)} className="w-full p-1 text-center border rounded outline-none" /></td>
                      ))}
                      <td className="p-2 border-r text-center font-bold bg-blue-50 text-blue-800">{media > 0 ? media.toFixed(2) : '-'}</td>
                      <td className="p-2 text-center font-bold bg-green-50 text-green-700">{padrao > 0 ? padrao.toFixed(2) : '-'}</td>
                      <td className="p-2 text-center"><button onClick={() => deletarTarefa(postoIndex, tarefaIndex)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">✖</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={() => adicionarTarefa(postoIndex)} className="mt-3 text-sm text-indigo-600 font-bold hover:underline">+ Adicionar Nova Tarefa</button>
        </div>
      ))}
      <div className="flex justify-center"><button onClick={adicionarPosto} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold shadow hover:bg-gray-300 transition border border-gray-400 border-dashed">+ Adicionar Posto</button></div>
    </div>
  );

  const renderDashboard = () => {
    let tempoTotalGeral = 0, tempoTotalVA = 0;
    const dadosDashboard = postos.map(posto => {
      let VA = 0, NNVA = 0, NVA = 0;
      posto.tarefas.forEach(tarefa => {
        const ciclosLimpos = removerOutliersZScore(tarefa.ciclos);
        const tempoEfetivoTarefa = ((calcularMedia(ciclosLimpos) * (posto.ritmo / 100)) * (1 + (posto.tolerancia / 100))) / posto.operadores;
        if (tarefa.classificacao === 'VA') VA += tempoEfetivoTarefa;
        else if (tarefa.classificacao === 'NNVA') NNVA += tempoEfetivoTarefa;
        else if (tarefa.classificacao === 'NVA') NVA += tempoEfetivoTarefa;
      });
      const tempoEfetivoPosto = VA + NNVA + NVA;
      tempoTotalGeral += tempoEfetivoPosto;
      tempoTotalVA += VA;
      return { name: posto.nome, VA: parseFloat(VA.toFixed(2)), NNVA: parseFloat(NNVA.toFixed(2)), NVA: parseFloat(NVA.toFixed(2)), tempoEfetivo: parseFloat(tempoEfetivoPosto.toFixed(2)) };
    });

    const tempoGargalo = Math.max(...dadosDashboard.map(d => d.tempoEfetivo), 0);
    const eficienciaBalanceamento = tempoGargalo > 0 ? ((tempoTotalGeral / (postos.length * tempoGargalo)) * 100).toFixed(1) : 0;

    return (
      <div className="max-w-6xl mx-auto mt-6 mb-10 relative">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-md border-b-4 border-indigo-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Yamazumi - {getProdutoAtual().nome}</h2>
            <p className="text-sm text-gray-500 font-bold">PN: {getProdutoAtual().pn} | Resp: {getResponsavelAtual().nome}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTelaAtual('coleta')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow font-bold hover:bg-gray-300 transition">📝 Editar Tempos</button>
            <button onClick={() => salvarEstudoNoHistorico({ eficiencia: eficienciaBalanceamento, gargalo: tempoGargalo.toFixed(2) })} className="bg-blue-600 text-white px-6 py-2 rounded shadow font-bold hover:bg-blue-700 transition">💾 Salvar no Histórico</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-end mb-4">
             <div className="flex gap-4 text-sm font-bold">
                <span className="text-green-600">■ VA</span><span className="text-yellow-500">■ NNVA</span><span className="text-red-500">■ NVA</span>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">Eficiência Linha</p>
                <p className="text-2xl font-black text-indigo-700">{eficienciaBalanceamento}%</p>
             </div>
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDashboard} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontWeight="bold" />
                <YAxis label={{ value: 'Tempo Efetivo (s)', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="VA" stackId="a" fill="#10b981" onClick={(d) => setPostoSelecionado(postos.find(p => p.nome === d.name))} className="cursor-pointer" />
                <Bar dataKey="NNVA" stackId="a" fill="#f59e0b" onClick={(d) => setPostoSelecionado(postos.find(p => p.nome === d.name))} className="cursor-pointer" />
                <Bar dataKey="NVA" stackId="a" fill="#ef4444" onClick={(d) => setPostoSelecionado(postos.find(p => p.nome === d.name))} className="cursor-pointer">
                   <LabelList dataKey="tempoEfetivo" position="top" fontWeight="bold" fontSize={14} fill="#374151" formatter={(v) => `${v}s`} />
                </Bar>
                <ReferenceLine y={taktFinal} stroke="#2563eb" strokeWidth={3} strokeDasharray="5 5" label={{ position: 'top', value: `TAKT: ${taktFinal.toFixed(2)}s`, fill: '#2563eb', fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MODAL DRILL DOWN OMITIDO AQUI POR ESPAÇO, MAS ESTÁ IDENTICO AO CÓDIGO ANTERIOR */}
      </div>
    );
  };

  // ===========================================================================
  // TELA 2: HISTÓRICO (Com Visualização Embutida)
  // ===========================================================================
  
  // Função que desenha o Dashboard de um estudo salvo
  const renderDashboardHistorico = (registro) => {
    // Recalcula dados baseados no snapshot
    const snapEstudo = registro.snapshot.estudo;
    const snapPostos = registro.snapshot.postos;
    const snapTurnos = registro.snapshot.turnos;
    
    const tDispSeg = Math.round(snapTurnos.filter(t => t.ativo).reduce((a, t) => a + t.horas, 0) * 3600);
    const tCalc = snapEstudo.demanda > 0 ? (tDispSeg / snapEstudo.demanda) : 0;
    const tFinal = Number(snapEstudo.taktPlanejado) > 0 ? Number(snapEstudo.taktPlanejado) : tCalc;

    let tempoTotalGeral = 0, tempoTotalVA = 0;
    const dadosDashboard = snapPostos.map(posto => {
      let VA = 0, NNVA = 0, NVA = 0;
      posto.tarefas.forEach(tarefa => {
        const ciclosLimpos = removerOutliersZScore(tarefa.ciclos);
        const tempoEfetivoTarefa = ((calcularMedia(ciclosLimpos) * (posto.ritmo / 100)) * (1 + (posto.tolerancia / 100))) / posto.operadores;
        if (tarefa.classificacao === 'VA') VA += tempoEfetivoTarefa;
        else if (tarefa.classificacao === 'NNVA') NNVA += tempoEfetivoTarefa;
        else if (tarefa.classificacao === 'NVA') NVA += tempoEfetivoTarefa;
      });
      const tempoEfetivoPosto = VA + NNVA + NVA;
      tempoTotalGeral += tempoEfetivoPosto;
      tempoTotalVA += VA;
      return { name: posto.nome, VA: parseFloat(VA.toFixed(2)), NNVA: parseFloat(NNVA.toFixed(2)), NVA: parseFloat(NVA.toFixed(2)), tempoEfetivo: parseFloat(tempoEfetivoPosto.toFixed(2)) };
    });

    return (
      <div className="max-w-6xl mx-auto mt-6 mb-10 relative animate-[fadeIn_0.3s_ease-in-out]">
        
        {/* BARRA SUPERIOR DE AÇÕES */}
        <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl shadow-md text-white">
          <div>
            <h2 className="text-2xl font-bold">Visualização de Histórico</h2>
            <p className="text-sm text-slate-400">Data da Medição: {registro.dataHora}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEstudoSelecionadoHistorico(null)} className="bg-slate-600 text-white px-4 py-2 rounded shadow font-bold hover:bg-slate-500 transition">
              ⬅️ Voltar à Lista
            </button>
            <button onClick={() => carregarParaNovaRevisao(registro)} className="bg-emerald-500 text-white px-6 py-2 rounded shadow font-bold hover:bg-emerald-600 transition">
              📝 Editar como Nova Revisão
            </button>
          </div>
        </div>

        {/* PAINEL DE DETALHES DO ESTUDO */}
        <div className="grid grid-cols-4 gap-4 mb-6">
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-slate-500">
             <p className="text-xs text-gray-500 font-bold uppercase">Produto / PN</p>
             <p className="text-lg font-bold text-gray-800 leading-tight">{registro.produtoNome}</p>
             <p className="text-sm text-blue-600 font-mono font-bold">{registro.pn}</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-slate-500">
             <p className="text-xs text-gray-500 font-bold uppercase">Responsável</p>
             <p className="text-lg font-bold text-gray-800 leading-tight">{registro.responsavelNome}</p>
             <p className="text-sm text-gray-500">{snapEstudo.qtdPostos} Postos | {snapEstudo.headcountTotal} Operadores</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-slate-500">
             <p className="text-xs text-gray-500 font-bold uppercase">Demanda / Turno</p>
             <p className="text-lg font-bold text-gray-800 leading-tight">{snapEstudo.demanda} unidades</p>
             <p className="text-sm text-gray-500">{tDispSeg} seg. disponíveis</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-slate-500">
             <p className="text-xs text-gray-500 font-bold uppercase">Concessão / Ciclo</p>
             <p className="text-lg font-bold text-gray-800 leading-tight">{snapEstudo.concessaoGeral}% NR-17</p>
             <p className="text-sm text-gray-500">Cycle Time: {(taktFinal * (1 - (snapEstudo.concessaoGeral / 100))).toFixed(2)}s</p>
           </div>
        </div>

        {/* GRÁFICO YAMAZUMI ESTATICO */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-end mb-4 border-b pb-4">
             <div className="flex gap-4 text-sm font-bold">
                <span className="text-green-600">■ VA</span><span className="text-yellow-500">■ NNVA</span><span className="text-red-500">■ NVA</span>
             </div>
             <div className="text-right flex gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Gargalo</p>
                  <p className="text-2xl font-black text-red-600">{registro.gargalo}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Eficiência</p>
                  <p className="text-2xl font-black text-indigo-700">{registro.eficiencia}%</p>
                </div>
             </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDashboard} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontWeight="bold" />
                <YAxis label={{ value: 'Tempo Efetivo (s)', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="VA" stackId="a" fill="#10b981" onClick={(d) => setPostoSelecionado(snapPostos.find(p => p.nome === d.name))} className="cursor-pointer" />
                <Bar dataKey="NNVA" stackId="a" fill="#f59e0b" onClick={(d) => setPostoSelecionado(snapPostos.find(p => p.nome === d.name))} className="cursor-pointer" />
                <Bar dataKey="NVA" stackId="a" fill="#ef4444" onClick={(d) => setPostoSelecionado(snapPostos.find(p => p.nome === d.name))} className="cursor-pointer">
                   <LabelList dataKey="tempoEfetivo" position="top" fontWeight="bold" fontSize={14} fill="#374151" formatter={(v) => `${v}s`} />
                </Bar>
                <ReferenceLine y={tFinal} stroke="#2563eb" strokeWidth={3} strokeDasharray="5 5" label={{ position: 'top', value: `TAKT: ${tFinal.toFixed(2)}s`, fill: '#2563eb', fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MODAL DRILL DOWN DO HISTORICO */}
        {postoSelecionado && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
              <div className="bg-slate-800 p-4 px-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Análise Histórica - <span className="text-blue-400">{postoSelecionado.nome}</span></h3>
                <button onClick={() => setPostoSelecionado(null)} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
              </div>
              <div className="p-6">
                <div className="max-h-80 overflow-y-auto pr-2">
                  {postoSelecionado.tarefas.map(t => {
                    const ciclosLimpos = removerOutliersZScore(t.ciclos);
                    const tempoPadrao = (calcularMedia(ciclosLimpos) * (postoSelecionado.ritmo / 100)) * (1 + (postoSelecionado.tolerancia / 100));
                    return { descricao: t.descricao || 'Sem nome', tipo: t.classificacao, tempo: parseFloat((tempoPadrao / postoSelecionado.operadores).toFixed(2)) };
                  })
                  .sort((a, b) => b.tempo - a.tempo)
                  .map((tarefa, index) => {
                    const corBarra = tarefa.tipo === 'VA' ? 'bg-green-500' : tarefa.tipo === 'NNVA' ? 'bg-yellow-500' : 'bg-red-500';
                    const percentualTakt = Math.min((tarefa.tempo / (tFinal || 1)) * 100, 100);
                    return (
                      <div key={index} className="mb-5">
                        <div className="flex justify-between items-end mb-1">
                          <span className="font-bold text-gray-700 text-sm">{tarefa.descricao} <span className={`text-xs px-2 py-0.5 ml-2 rounded text-white ${corBarra}`}>{tarefa.tipo}</span></span>
                          <span className="font-bold text-gray-900">{tarefa.tempo}s</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${corBarra}`} style={{ width: `${percentualTakt}%` }}></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderHistorico = () => {
    // Se um estudo foi clicado, renderiza a tela de visualização em vez da tabela
    if (estudoSelecionadoHistorico) {
      return renderDashboardHistorico(estudoSelecionadoHistorico);
    }

    const historicoFiltrado = listaHistorico.filter(item => 
      item.produtoNome.toLowerCase().includes(buscaHistorico.toLowerCase()) || 
      item.pn.toLowerCase().includes(buscaHistorico.toLowerCase())
    );

    return (
      <div className="max-w-6xl mx-auto mt-6 bg-white p-8 rounded-xl shadow border-t-4 border-slate-800">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">📚 Histórico de Cronoanálises</h2>
        <div className="bg-slate-100 p-4 rounded-lg flex items-center gap-4 mb-6 border border-slate-300">
          <span className="font-bold text-slate-700">🔎 Buscar:</span>
          <input type="text" placeholder="Nome do Produto ou Part Number..." value={buscaHistorico} onChange={(e) => setBuscaHistorico(e.target.value)} className="flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="p-3">Data da Medição</th><th className="p-3">Produto</th><th className="p-3">PN</th>
                <th className="p-3 text-center">Eficiência</th><th className="p-3 text-center">Gargalo</th>
              </tr>
            </thead>
            <tbody>
              {historicoFiltrado.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-bold">Nenhum estudo salvo no histórico. Vá em "Nova Cronoanálise", preencha e clique em Salvar!</td></tr>
              ) : (
                historicoFiltrado.map(h => (
                  <tr key={h.id} onClick={() => setEstudoSelecionadoHistorico(h)} className="border-b hover:bg-blue-50 cursor-pointer transition">
                    <td className="p-3 font-semibold text-slate-600">{h.dataHora}</td>
                    <td className="p-3 font-bold text-slate-800">{h.produtoNome}</td>
                    <td className="p-3 text-blue-600 font-mono font-bold">{h.pn}</td>
                    <td className="p-3 text-center font-bold text-indigo-700">{h.eficiencia}%</td>
                    <td className="p-3 text-center font-bold text-red-600">{h.gargalo}s</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {historicoFiltrado.length > 0 && <p className="text-center text-xs text-gray-400 p-2">* Clique sobre qualquer linha para abrir o Relatório Completo do Estudo.</p>}
        </div>
      </div>
    );
  };

  // ===========================================================================
  // TELA 3: CADASTROS MASTER DATA (OMITIDO O CÓDIGO INTERNO PARA ECONOMIZAR ESPAÇO, MANTENHA O SEU ANTERIOR)
  // ===========================================================================
  const renderCadastros = () => (
     <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* ... MATENHA O CÓDIGO EXATO DO SEU RENDER CADASTROS ANTERIOR AQUI ... */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Responsáveis pela Medição</h2>
        <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
          <input type="text" placeholder="Nome Completo" value={novoResponsavel.nome} onChange={(e) => setNovoResponsavel({...novoResponsavel, nome: e.target.value})} className="flex-1 p-2 border rounded" />
          <input type="text" placeholder="Cargo" value={novoResponsavel.cargo} onChange={(e) => setNovoResponsavel({...novoResponsavel, cargo: e.target.value})} className="flex-1 p-2 border rounded" />
          <button onClick={cadastrarResponsavel} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded hover:bg-indigo-700">+ Add</button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-200"><th className="p-2 border">Nome</th><th className="p-2 border">Cargo</th></tr></thead>
          <tbody>
            {responsaveisDB.map(r => (<tr key={r.id} className="border-b"><td className="p-2 font-bold">{r.nome}</td><td className="p-2 text-slate-600">{r.cargo}</td></tr>))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-emerald-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Base de Produtos (NPI/Corrente)</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
          <input type="text" placeholder="Nome do Produto" value={novoProduto.nome} onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})} className="col-span-2 p-2 border rounded" />
          <input type="text" placeholder="Part Number (PN)" value={novoProduto.pn} onChange={(e) => setNovoProduto({...novoProduto, pn: e.target.value})} className="p-2 border rounded" />
          <select value={novoProduto.fase} onChange={(e) => setNovoProduto({...novoProduto, fase: e.target.value})} className="p-2 border rounded font-bold text-emerald-700 bg-emerald-50">
            <option value="NPI">NPI</option><option value="Corrente">Corrente</option><option value="EOL">EOL</option>
          </select>
          <button onClick={cadastrarProduto} className="col-span-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded">+ Cadastrar Produto</button>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-200"><th className="p-2 border">Produto</th><th className="p-2 border">PN</th><th className="p-2 border text-center">Fase</th></tr></thead>
          <tbody>
            {produtosDB.map(p => {
              const corFase = p.fase === 'NPI' ? 'bg-blue-100 text-blue-800' : p.fase === 'Corrente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
              return (
              <tr key={p.id} className="border-b"><td className="p-2 font-bold">{p.nome}</td><td className="p-2 font-mono">{p.pn}</td><td className="p-2 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${corFase}`}>{p.fase}</span></td></tr>
            )})}
          </tbody>
        </table>
      </div>
     </div>
  );

  // ===========================================================================
  // MASTER RENDER
  // ===========================================================================
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-xl">⏳</div>
            <div><h1 className="text-xl font-bold tracking-wide">Cronoanálise & Balanceamento</h1></div>
          </div>
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
            <button onClick={() => { setAbaAtiva('novaCrono'); setTelaAtual('setup'); }} className={`px-6 py-2 rounded-md font-bold transition ${abaAtiva === 'novaCrono' && telaAtual === 'setup' ? 'bg-blue-500 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
              1. Setup
            </button>
            <button onClick={() => { if(estudo.produtoSelecionado) { setAbaAtiva('novaCrono'); setTelaAtual('coleta'); } else alert("Preencha o Setup primeiro!"); }} className={`px-6 py-2 rounded-md font-bold transition ${abaAtiva === 'novaCrono' && telaAtual === 'coleta' ? 'bg-blue-500 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
              2. Coleta de Dados
            </button>
            <button onClick={() => { setAbaAtiva('historico'); setEstudoSelecionadoHistorico(null); }} className={`ml-4 border-l border-slate-600 pl-6 px-6 py-2 rounded-md font-bold transition ${abaAtiva === 'historico' ? 'bg-indigo-600 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
              📚 Histórico
            </button>
            <button onClick={() => setAbaAtiva('cadastros')} className={`px-6 py-2 rounded-md font-bold transition ${abaAtiva === 'cadastros' ? 'bg-indigo-600 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
              ⚙️ Cadastros
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4">
        {abaAtiva === 'novaCrono' && telaAtual === 'setup' && renderSetup()}
        {abaAtiva === 'novaCrono' && telaAtual === 'coleta' && renderColeta()}
        {abaAtiva === 'novaCrono' && telaAtual === 'dashboard' && renderDashboard()}
        
        {abaAtiva === 'historico' && renderHistorico()}
        {abaAtiva === 'cadastros' && renderCadastros()}
      </div>
    </div>
  );
}
