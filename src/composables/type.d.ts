
interface TemplateContent {
    contents: string
}

interface PublicTemplate {
    id: number
    name: string
    icon: string
    category: string
    description: string
    slug: string
    views: number
    downloads: number
    runs: number
    created: string
    existsLocally?: boolean
    filePath?: string
}
