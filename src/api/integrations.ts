// Équivalent local de base44.integrations.Core.UploadFile : le fichier est converti en data URL.
// Dans Base44, l'appel renvoie une vraie URL hébergée.
export const integrations = {
  Core: {
    async UploadFile({ file }: { file: File }): Promise<{ file_url: string }> {
      const file_url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      return { file_url }
    },
  },
}
