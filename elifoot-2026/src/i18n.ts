import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'pt' | 'en' | 'es';

const translations: Record<Lang, Record<string, string>> = {
  pt: {
    // Navegação
    nav_home: 'Início',
    nav_squad: 'Elenco',
    nav_fixtures: 'Calendário',
    nav_transfers: 'Transferências',
    nav_training: 'Treinamento',
    nav_finance: 'Financeiro',
    nav_tactics: 'Táticas',
    nav_history: 'Histórico',
    nav_competitions: 'Competições',
    // Ações comuns
    save: 'Salvar',
    exit: 'Sair',
    advance: 'Avançar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Voltar',
    // Dashboard
    next_match: 'Próxima partida',
    objectives: 'Objetivos',
    finances: 'Finanças',
    news: 'Notícias',
    play_match: 'Jogar partida',
    advance_to_matchday: 'Avançar para o dia da partida',
    no_matches: 'Sem mais partidas agendadas.',
    skip_day: 'Pular dia',
    skip_day_desc: 'Simula partidas dos outros times e processa finanças',
    // Temporada
    season_over: 'Temporada Encerrada!',
    start_new_season: 'Iniciar Temporada',
    final_position: 'Posição final',
    objectives_met: 'Objetivos cumpridos',
    titles: 'Títulos',
    full_history: 'Ver historial completo',
    // Transferências
    transfers: 'Mercado de Transferências',
    available: 'Disponíveis',
    my_players: 'Meus Jogadores',
    my_bids: 'Minhas Ofertas',
    window_open: 'Janela de transferências aberta',
    window_closed: 'Janela fechada',
    make_offer: 'Ofertar',
    accept: 'Aceitar',
    reject: 'Recusar',
    listed: 'Listado',
    // Partida
    start_match: 'Iniciar Partida',
    halftime: 'Intervalo',
    full_time: 'Fim de jogo',
    substitutions: 'Substituições',
    narration: 'Narração',
    back_to_panel: 'Voltar ao painel',
    // Treinamento
    training: 'Treinamento',
    // Táticas
    tactics: 'Táticas',
    formation: 'Formação',
    posture: 'Postura Tática',
    pressing: 'Pressing',
    // Elenco
    squad: 'Elenco',
    promote: 'Promover',
    youth_academy: 'Base / Academia',
    save_lineup: 'Salvar escalação',
    // Times customizados
    custom_team: 'Time personalizado',
    create_custom_team: 'Criar time personalizado',
    team_name: 'Nome do time',
    short_name: 'Sigla (3 letras)',
    city: 'Cidade',
    primary_color: 'Cor primária',
    secondary_color: 'Cor secundária',
    strength: 'Nível',
    // Home page
    new_game: 'Novo Jogo',
    continue_game: 'Continuar',
    saved_games: 'Jogos salvos',
    export_save: 'Exportar',
    import_save: 'Importar save',
    manager: 'Téc.',
    season: 'Temp.',
    day: 'Dia',
    // Som
    sound_on: 'Som ativo',
    sound_off: 'Som desativado',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_squad: 'Squad',
    nav_fixtures: 'Fixtures',
    nav_transfers: 'Transfers',
    nav_training: 'Training',
    nav_finance: 'Finance',
    nav_tactics: 'Tactics',
    nav_history: 'History',
    nav_competitions: 'Competitions',
    // Common actions
    save: 'Save',
    exit: 'Exit',
    advance: 'Advance',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    // Dashboard
    next_match: 'Next match',
    objectives: 'Objectives',
    finances: 'Finances',
    news: 'News',
    play_match: 'Play match',
    advance_to_matchday: 'Advance to matchday',
    no_matches: 'No more fixtures scheduled.',
    skip_day: 'Skip day',
    skip_day_desc: 'Simulate other teams\' matches and process finances',
    // Season
    season_over: 'Season Over!',
    start_new_season: 'Start Season',
    final_position: 'Final position',
    objectives_met: 'Objectives met',
    titles: 'Titles',
    full_history: 'Full history',
    // Transfers
    transfers: 'Transfer Market',
    available: 'Available',
    my_players: 'My Players',
    my_bids: 'My Bids',
    window_open: 'Transfer window open',
    window_closed: 'Window closed',
    make_offer: 'Bid',
    accept: 'Accept',
    reject: 'Reject',
    listed: 'Listed',
    // Match
    start_match: 'Start Match',
    halftime: 'Halftime',
    full_time: 'Full Time',
    substitutions: 'Substitutions',
    narration: 'Commentary',
    back_to_panel: 'Back to dashboard',
    // Training
    training: 'Training',
    // Tactics
    tactics: 'Tactics',
    formation: 'Formation',
    posture: 'Tactical Posture',
    pressing: 'Pressing',
    // Squad
    squad: 'Squad',
    promote: 'Promote',
    youth_academy: 'Youth Academy',
    save_lineup: 'Save lineup',
    // Custom teams
    custom_team: 'Custom team',
    create_custom_team: 'Create custom team',
    team_name: 'Team name',
    short_name: 'Code (3 letters)',
    city: 'City',
    primary_color: 'Primary color',
    secondary_color: 'Secondary color',
    strength: 'Level',
    // Home page
    new_game: 'New Game',
    continue_game: 'Continue',
    saved_games: 'Saved games',
    export_save: 'Export',
    import_save: 'Import save',
    manager: 'Mgr.',
    season: 'Season',
    day: 'Day',
    // Sound
    sound_on: 'Sound on',
    sound_off: 'Sound off',
  },
  es: {
    // Navegación
    nav_home: 'Inicio',
    nav_squad: 'Plantilla',
    nav_fixtures: 'Calendario',
    nav_transfers: 'Fichajes',
    nav_training: 'Entrenamiento',
    nav_finance: 'Finanzas',
    nav_tactics: 'Tácticas',
    nav_history: 'Historia',
    nav_competitions: 'Competiciones',
    // Acciones comunes
    save: 'Guardar',
    exit: 'Salir',
    advance: 'Avanzar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Volver',
    // Dashboard
    next_match: 'Próximo partido',
    objectives: 'Objetivos',
    finances: 'Finanzas',
    news: 'Noticias',
    play_match: 'Jugar partido',
    advance_to_matchday: 'Avanzar al día del partido',
    no_matches: 'Sin más partidos programados.',
    skip_day: 'Saltar día',
    skip_day_desc: 'Simula los partidos de otros equipos y procesa las finanzas',
    // Temporada
    season_over: '¡Temporada Terminada!',
    start_new_season: 'Iniciar Temporada',
    final_position: 'Posición final',
    objectives_met: 'Objetivos cumplidos',
    titles: 'Títulos',
    full_history: 'Historia completa',
    // Transferencias
    transfers: 'Mercado de Fichajes',
    available: 'Disponibles',
    my_players: 'Mis Jugadores',
    my_bids: 'Mis Ofertas',
    window_open: 'Ventana de fichajes abierta',
    window_closed: 'Ventana cerrada',
    make_offer: 'Ofertar',
    accept: 'Aceptar',
    reject: 'Rechazar',
    listed: 'Listado',
    // Partido
    start_match: 'Iniciar Partido',
    halftime: 'Descanso',
    full_time: 'Fin del partido',
    substitutions: 'Sustituciones',
    narration: 'Narración',
    back_to_panel: 'Volver al panel',
    // Entrenamiento
    training: 'Entrenamiento',
    // Tácticas
    tactics: 'Tácticas',
    formation: 'Formación',
    posture: 'Postura Táctica',
    pressing: 'Presión',
    // Plantilla
    squad: 'Plantilla',
    promote: 'Ascender',
    youth_academy: 'Academia / Cantera',
    save_lineup: 'Guardar alineación',
    // Equipos personalizados
    custom_team: 'Equipo personalizado',
    create_custom_team: 'Crear equipo personalizado',
    team_name: 'Nombre del equipo',
    short_name: 'Código (3 letras)',
    city: 'Ciudad',
    primary_color: 'Color principal',
    secondary_color: 'Color secundario',
    strength: 'Nivel',
    // Página principal
    new_game: 'Nueva Partida',
    continue_game: 'Continuar',
    saved_games: 'Partidas guardadas',
    export_save: 'Exportar',
    import_save: 'Importar partida',
    manager: 'Téc.',
    season: 'Temp.',
    day: 'Día',
    // Sonido
    sound_on: 'Sonido activado',
    sound_off: 'Sonido desactivado',
  },
};

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'pt' as Lang,
      setLang(lang) { set({ lang }); },
    }),
    { name: 'elifoot_lang' },
  ),
);

export function useT() {
  const lang = useI18nStore((s) => s.lang);
  return (key: string) =>
    translations[lang][key] ?? translations.pt[key] ?? key;
}
