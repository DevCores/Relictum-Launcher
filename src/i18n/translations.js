export const translations = {
  en: {
    // Navigation
    menu: {
      dashboard: 'Dashboard',
      clients: 'CLIENTS',
      downloads: 'DOWNLOADS',
      settings: 'Settings',
      about: 'About',
      manageClients: 'Manage Clients',
      manageClientsBtn: 'Manage Clients',
      downloadsBtn: 'Game Clients',
      toggleMusic: 'Toggle Music',
      updateAvailable: 'Update Available'
    },

    // Dashboard
    dashboard: {
      title: 'WELCOME TO',
      subtitle: 'AZEROTH LEGACY LAUNCHER',
      description: 'A new experience with private servers. Seamlessly manage your clients, addons, and gameplay in one unified hub.',
      joinCommunity: 'Join Community'
    },

    // Game Details
    gameDetails: {
      version: 'Game Version',
      path: 'Installation Path',
      updates: 'Client Updates',
      configureRealmlist: 'Configure Realmlist',
      play: 'PLAY',
      playing: 'PLAYING',
      wrongVersion: 'WRONG VERSION',
      locateGame: 'Locate Existing Installation',
      checkUpdates: 'Check Again',
      repairClient: 'Repair Client',
      downloadAndInstall: 'Download & Install',
      notInstalled: 'Not Installed',
      valid: 'Client Valid',
      missing: 'Files Missing',
      corrupted: 'Files Corrupted',
      updateAvailable: 'Update Available',
      upToDate: 'Up to Date',
      detected: 'Detected',
      incompatible: 'Incompatible',
      statusValid: 'Client Valid',
      statusMissing: 'Files Missing',
      statusCorrupted: 'Files Corrupted',
      statusUnknown: 'Unknown Status'
    },

    // Downloads
    downloads: {
      title: 'Game Client Downloads',
      subtitle: 'Download and install World of Warcraft clients',
      notice: 'Important Notice',
      noticeText: 'These downloads are provided for private server use only. Make sure you have permission to download and use this software.',
      downloadAndInstall: 'Download & Install',
      downloading: 'Downloading...',
      installing: 'Installing...',
      size: 'Size',
      version: 'Version',
      instructions: 'Installation Instructions',
      instructionsList: [
        'Click "Download & Install" for your preferred client',
        'Choose installation directory when prompted',
        'Wait for download and extraction to complete',
        'Configure your realmlist to connect to your private server',
        'Launch the game and enjoy!'
      ],
      help: 'Need Help?',
      helpText: 'If you encounter any issues with downloads or installation, please contact our support team.'
    },

    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      audio: 'Audio',
      game: 'Game',
      notifications: 'Notifications',
      downloads: 'Downloads',
      playMusicOnStartup: 'Play music on startup',
      autoCloseLauncher: 'Auto-close launcher when game starts',
      clearCacheOnLaunch: 'Clear cache on game launch',
      enableNotifications: 'Enable notifications',
      enableSoundEffects: 'Enable sound effects',
      defaultDownloadPath: 'Default download path',
      browse: 'Browse',
      clear: 'Clear',
      changePath: 'Change Path',
      clearDefaultPath: 'Clear Default Path',
      cleanNow: 'Clean Now',
      appVersion: 'App Version',
      integrity: 'Integrity',
      secure: 'Protected by Developer',
      warning: 'Verification Warning',
      danger: 'Integrity Mismatch!',
      unknown: 'Unknown'
    },

    // About
    about: {
      title: 'About Azeroth Legacy Launcher',
      description: 'The ultimate, secure, and modern launcher for private servers supporting 1.12.1, 2.4.3, and 3.3.5a.',
      features: 'Key Features',
      security: 'Security & Integrity',
      addons: 'Addon Management',
      experience: 'Immersive Experience',
      management: 'Smart Game Management',
      realmlist: 'Realmlist Editor',
      realmlistDesc: 'Edit and save server addresses with quick history.',
      securityDesc: 'Advanced integrity verification ensures your client is authentic and unmodified.',
      addonsDesc: 'Browse, download, and manage addons with one-click installation.',
      musicDesc: 'Enjoy the iconic soundtracks while you browse.',
      managementDesc: 'Multi-version support with intelligent game detection.',
      securityTitleSecure: 'Secure & Verified',
      securityTitleWarning: 'Security Warning',
      securityTitleDanger: 'Security Risk',
      securitySubtitleSecure: 'Protected by Developer',
      securitySubtitleWarning: 'Hash Mismatch Detected',
      securitySubtitleDanger: 'Integrity Compromised',
      techStack: 'Tech Stack',
      core: 'Core',
      frontend: 'Frontend',
      security: 'Security',
      styling: 'Styling',
      icons: 'Icons'
    },

    // Modals
    modals: {
      cancel: 'Cancel',
      done: 'Done',
      ok: 'OK',
      save: 'Save Changes',
      reset: 'Reset to Default',
      saveName: 'Save Name',
      remove: 'Remove',
      downloadUnavailable: 'Download Unavailable',
      downloadUnavailableDesc: 'Client downloads are no longer supported.',
      installationRequired: 'Installation Required',
      installationComplete: 'Installation Complete',
      renameClient: 'Rename Client',
      renameDesc: 'Enter a custom name for this client in the sidebar:',
      manageClientsIntro: 'Установленные игровые клиенты в вашей системе:',
      addClientHelp: 'Чтобы добавить клиент, скачайте его из раздела "Игровые клиенты" и установите.',
      installed: '✓ Установлено',
      notInstalled: '✗ Не установлено',
      editRealmlist: 'Редактировать Realmlist',
      realmlistHint: 'Для Warmane должно быть: set realmlist logon.warmane.com',
      quickSelect: 'Быстрый выбор / История:',
      editRealmlist: 'Edit Realmlist',
      realmlistHint: 'For Warmane, it should be: set realmlist logon.warmane.com',
      quickSelect: 'Quick Select / History:'
    },

    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      retry: 'Retry',
      skip: 'Skip',
      minimize: 'Minimize',
      maximize: 'Maximize',
      changeLanguage: 'Change Language'
    },

    // Games
    games: {
      classic: {
        name: 'World of Warcraft Classic',
        shortName: 'Classic',
        version: '1.12.1'
      },
      tbc: {
        name: 'The Burning Crusade',
        shortName: 'TBC',
        version: '2.4.3'
      },
      wotlk: {
        name: 'Wrath of the Lich King',
        shortName: 'WotLK',
        version: '3.3.5a'
      }
    }
  },

  ru: {
    // Navigation
    menu: {
      dashboard: 'Главная',
      clients: 'КЛИЕНТЫ',
      downloads: 'ЗАГРУЗКИ',
      settings: 'Настройки',
      about: 'О программе',
      manageClients: 'Управление',
      manageClientsBtn: 'Управление',
      downloadsBtn: 'Игровые клиенты',
      toggleMusic: 'Включить/выключить музыку',
      updateAvailable: 'Доступно обновление'
    },

    // Dashboard
    dashboard: {
      title: 'ДОБРО ПОЖАЛОВАТЬ В',
      subtitle: 'AZEROTH LEGACY LAUNCHER',
      description: 'Новый опыт с приватными серверами. Легко управляйте своими клиентами, аддонами и игровым процессом в едином интерфейсе.',
      joinCommunity: 'Присоединиться к сообществу'
    },

    // Game Details
    gameDetails: {
      version: 'Версия игры',
      path: 'Путь установки',
      updates: 'Обновления клиента',
      configureRealmlist: 'Настроить Realmlist',
      play: 'ИГРАТЬ',
      playing: 'ИГРАЕТ',
      wrongVersion: 'НЕПРАВИЛЬНАЯ ВЕРСИЯ',
      locateGame: 'Найти существующую установку',
      checkUpdates: 'Проверить снова',
      repairClient: 'Восстановить клиент',
      downloadAndInstall: 'Скачать и установить',
      notInstalled: 'Не установлено',
      valid: 'Клиент валиден',
      missing: 'Файлы отсутствуют',
      corrupted: 'Файлы повреждены',
      updateAvailable: 'Доступно обновление',
      upToDate: 'Обновлено',
      detected: 'Обнаружено',
      incompatible: 'Несовместимо',
      statusValid: 'Клиент валиден',
      statusMissing: 'Файлы отсутствуют',
      statusCorrupted: 'Файлы повреждены',
      statusUnknown: 'Неизвестный статус'
    },

    // Downloads
    downloads: {
      title: 'Скачивание игровых клиентов',
      subtitle: 'Скачайте и установите клиенты World of Warcraft',
      notice: 'Важное уведомление',
      noticeText: 'Эти загрузки предназначены только для использования с приватными серверами. Убедитесь, что у вас есть разрешение на скачивание и использование этого программного обеспечения.',
      downloadAndInstall: 'Скачать и установить',
      downloading: 'Скачивается...',
      installing: 'Устанавливается...',
      size: 'Размер',
      version: 'Версия',
      instructions: 'Инструкции по установке',
      instructionsList: [
        'Нажмите "Скачать и установить" для выбранного клиента',
        'Выберите директорию установки при запросе',
        'Дождитесь завершения загрузки и распаковки',
        'Настройте realmlist для подключения к серверу',
        'Запустите игру и наслаждайтесь!'
      ],
      help: 'Нужна помощь?',
      helpText: 'Если у вас возникли проблемы со скачиванием или установкой, обратитесь в службу поддержки.'
    },

    // Settings
    settings: {
      title: 'Настройки',
      language: 'Язык',
      theme: 'Тема',
      audio: 'Аудио',
      game: 'Игра',
      notifications: 'Уведомления',
      downloads: 'Загрузки',
      playMusicOnStartup: 'Воспроизводить музыку при запуске',
      autoCloseLauncher: 'Автоматически закрывать лаунчер при запуске игры',
      clearCacheOnLaunch: 'Очищать кэш при запуске игры',
      enableNotifications: 'Включить уведомления',
      enableSoundEffects: 'Включить звуковые эффекты',
      defaultDownloadPath: 'Путь загрузки по умолчанию',
      browse: 'Обзор',
      clear: 'Очистить',
      changePath: 'Изменить путь',
      clearDefaultPath: 'Очистить путь по умолчанию',
      cleanNow: 'Очистить сейчас',
      appVersion: 'Версия приложения',
      integrity: 'Целостность',
      secure: 'Защищено разработчиком',
      warning: 'Предупреждение проверки',
      danger: 'Несоответствие целостности!',
      unknown: 'Неизвестно'
    },

    // About
    about: {
      title: 'О программе Azeroth Legacy Launcher',
      description: 'Ультимативный, безопасный и современный лаунчер для приватных серверов, поддерживающий 1.12.1, 2.4.3 и 3.3.5a.',
      features: 'Ключевые возможности',
      security: 'Безопасность и целостность',
      addons: 'Управление аддонами',
      experience: 'Погружение',
      management: 'Умное управление игрой',
      realmlist: 'Редактор Realmlist',
      realmlistDesc: 'Редактируйте и сохраняйте адреса серверов с быстрой историей.',
      securityDesc: 'Расширенная проверка целостности гарантирует аутентичность вашего клиента.',
      addonsDesc: 'Просматривайте, скачивайте и управляйте аддонами с установкой в один клик.',
      musicDesc: 'Наслаждайтесь культовыми саундтреками во время навигации.',
      managementDesc: 'Поддержка нескольких версий с интеллектуальным обнаружением игр.',
      securityTitleSecure: 'Безопасно и проверено',
      securityTitleWarning: 'Предупреждение безопасности',
      securityTitleDanger: 'Риск безопасности',
      securitySubtitleSecure: 'Защищено разработчиком',
      securitySubtitleWarning: 'Обнаружено несоответствие хэша',
      securitySubtitleDanger: 'Целостность нарушена',
      techStack: 'Технологии',
      core: 'Ядро',
      frontend: 'Интерфейс',
      security: 'Безопасность',
      styling: 'Стилизация',
      icons: 'Иконки'
    },

    // Modals
    modals: {
      cancel: 'Отмена',
      done: 'Готово',
      ok: 'OK',
      save: 'Сохранить изменения',
      reset: 'Сбросить по умолчанию',
      saveName: 'Сохранить имя',
      remove: 'Удалить',
      downloadUnavailable: 'Загрузка недоступна',
      downloadUnavailableDesc: 'Загрузка клиентов больше не поддерживается.',
      installationRequired: 'Требуется установка',
      installationComplete: 'Установка завершена',
      renameClient: 'Переименовать клиент',
      renameDesc: 'Введите пользовательское имя для этого клиента в боковой панели:',
      manageClientsIntro: 'Установленные игровые клиенты в вашей системе:',
      addClientHelp: 'Чтобы добавить клиент, скачайте его из раздела "Игровые клиенты" и установите.',
      installed: '✓ Установлено',
      notInstalled: '✗ Не установлено'
    },

    // Common
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      warning: 'Предупреждение',
      info: 'Информация',
      close: 'Закрыть',
      save: 'Сохранить',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      yes: 'Да',
      no: 'Нет',
      retry: 'Повторить',
      skip: 'Пропустить',
      minimize: 'Свернуть',
      maximize: 'Развернуть',
      changeLanguage: 'Изменить язык'
    },

    // Games
    games: {
      classic: {
        name: 'World of Warcraft Classic',
        shortName: 'Классика',
        version: '1.12.1'
      },
      tbc: {
        name: 'The Burning Crusade',
        shortName: 'TBC',
        version: '2.4.3'
      },
      wotlk: {
        name: 'Wrath of the Lich King',
        shortName: 'WotLK',
        version: '3.3.5a'
      }
    }
  }
};
