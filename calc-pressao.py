# Função para calcular a pressão de ensaio
def calcular_pressao(quantidade_pavimentos, regiao):
    # Tabela de Pressão de Ensaio (com pavimentos definidos como 2, 5, 10, 20, 30)
    tabela_pressao = {
        1: [2, 5, 10, 20, 30],  # Região 1
        2: [2, 5, 10, 20, 30],  # Região 2
        # Adicione mais regiões e dados conforme necessário
    }
    
    # Caso a região não esteja na tabela
    if regiao not in tabela_pressao:
        return "Região não encontrada."
    
    # Obtendo os pavimentos da região selecionada
    pavimentos = tabela_pressao[regiao]

    # Verifica se a quantidade de pavimentos é maior que 30
    if quantidade_pavimentos > 30:
        return "Quantidade de pavimentos acima do limite (30). Não é possível calcular."
    
    # Encontrar o valor mais próximo acima da quantidade de pavimentos
    for pavimento in pavimentos:
        if quantidade_pavimentos <= pavimento:
            return pavimento

    # Se não encontrar, retorna o maior valor da tabela (para pavimentos acima de 30, por exemplo)
    return pavimentos[-1]

# Exemplo de uso
quantidade_pavimentos = 15  # Alterar para testar diferentes quantidades
regiao = 1  # Região 1

pressao = calcular_pressao(quantidade_pavimentos, regiao)
if isinstance(pressao, str):  # Se for uma string de erro, exibe o erro
    print(pressao)
else:
    print(f'A pressão de ensaio para a região {regiao} e {quantidade_pavimentos} pavimentos é: {pressao} kPa')
