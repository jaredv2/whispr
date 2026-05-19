import { useTranslation } from 'react-i18next'

const LangSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
      className="rounded-full border border-gray-800 px-3 py-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
    >
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}

export default LangSwitcher