import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Halaman Dalam Pengembangan
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Halaman {title.toLowerCase()} sedang dalam tahap pengembangan. 
            Fitur CRUD lengkap akan tersedia segera.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;