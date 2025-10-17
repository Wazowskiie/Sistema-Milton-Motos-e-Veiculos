const criarIndicesEstoque = async () => {
    const db = mongoose.connection.db;
    
    // Índices para códigos de barras
    await db.collection('codigos_barras').createIndex({ codigo: 1 }, { unique: true });
    await db.collection('codigos_barras').createIndex({ produtoId: 1, ativo: 1 });
    
    // Índices para histórico de preços
    await db.collection('historico_precos').createIndex({ produtoId: 1, data: -1 });
    await db.collection('historico_precos').createIndex({ data: -1, motivo: 1 });
    
    // Índices para integrações
    await db.collection('integracoes_fornecedores').createIndex({ fornecedorId: 1, ativo: 1 });
    await db.collection('integracoes_fornecedores').createIndex({ proximaSincronizacao: 1, ativo: 1 });
    
    // Índices para logs
    await db.collection('logs_sincronizacao').createIndex({ integracaoId: 1, dataInicio: -1 });
    
    console.log('✅ Índices de estoque criados com sucesso');
};

// Executar após conexão com banco
mongoose.connection.once('open', () => {
    criarIndicesEstoque().catch(console.error);
});
