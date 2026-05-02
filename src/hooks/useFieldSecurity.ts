import { useState, useEffect } from "react";

interface Restriction {
  res_cam_columna: string;
  res_cam_oculto: boolean;
  res_cam_editable: boolean;
}

export function useFieldSecurity(tableName: string) {
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const userJson = localStorage.getItem("user");
        const user = userJson ? JSON.parse(userJson) : null;
        
        if (!user) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/admin/my-restrictions?table=${tableName}`, {
          headers: {
            "x-user-email": user.email || "",
            "x-user-profile": user.perfil_cod?.toString() || ""
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setRestrictions(data);
        }
      } catch (e) {
        console.error("Error loading field security:", e);
      } finally {
        setLoading(false);
      }
    };

    if (tableName) {
      fetchRestrictions();
    }
  }, [tableName]);

  const isHidden = (columnName: string) => {
    return restrictions.some(r => r.res_cam_columna === columnName && r.res_cam_oculto);
  };

  const isReadOnly = (columnName: string) => {
    return restrictions.some(r => r.res_cam_columna === columnName && !r.res_cam_editable);
  };

  return { isHidden, isReadOnly, loadingRestrictions: loading };
}
