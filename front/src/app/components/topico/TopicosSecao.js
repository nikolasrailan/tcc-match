"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const TopicosSection = ({ onOpen, newTopicsCount }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Tópicos</Label>
        <Button variant="outline" size="sm" onClick={onOpen}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Tópicos
          {newTopicsCount > 0 && (
            <Badge className="ml-2">{newTopicsCount}</Badge>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TopicosSection;
