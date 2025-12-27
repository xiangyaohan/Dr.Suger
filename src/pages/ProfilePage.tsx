import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { UserPreference, BehaviorPattern, DiabetesType } from '@/types/types';
import { User, Heart, Brain, Plus, Trash2, TrendingUp } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // 档案信息
  const [diabetesType, setDiabetesType] = useState<DiabetesType | ''>('');
  const [medication, setMedication] = useState('');
  const [targetMin, setTargetMin] = useState('4.0');
  const [targetMax, setTargetMax] = useState('7.0');
  const [healthNotes, setHealthNotes] = useState('');

  // 偏好与禁忌
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [newPrefType, setNewPrefType] = useState<'allergy' | 'dislike' | 'habit' | 'schedule'>('allergy');
  const [newPrefContent, setNewPrefContent] = useState('');

  // 行为模式
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);

  useEffect(() => {
    if (profile) {
      setDiabetesType(profile.diabetes_type || '');
      setMedication(profile.medication || '');
      setTargetMin(profile.target_blood_sugar_min?.toString() || '4.0');
      setTargetMax(profile.target_blood_sugar_max?.toString() || '7.0');
      setHealthNotes(profile.health_notes || '');
    }
    loadPreferences();
    loadPatterns();
  }, [profile]);

  const loadPreferences = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('加载偏好失败:', error);
    } else {
      setPreferences(data || []);
    }
  };

  const loadPatterns = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('behavior_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('evidence_count', { ascending: false });

    if (error) {
      console.error('加载行为模式失败:', error);
    } else {
      setPatterns(data || []);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        diabetes_type: diabetesType || null,
        medication: medication || null,
        target_blood_sugar_min: parseFloat(targetMin),
        target_blood_sugar_max: parseFloat(targetMax),
        health_notes: healthNotes || null,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast.error('保存失败：' + error.message);
    } else {
      toast.success('档案已更新');
      refreshProfile();
    }
  };

  const handleAddPreference = async () => {
    if (!user || !newPrefContent.trim()) return;

    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        preference_type: newPrefType,
        content: newPrefContent.trim(),
        confidence: 'high',
        source: 'user_stated',
      });

    if (error) {
      toast.error('添加失败：' + error.message);
    } else {
      toast.success('已添加');
      setNewPrefContent('');
      loadPreferences();
    }
  };

  const handleDeletePreference = async (id: string) => {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('删除失败：' + error.message);
    } else {
      toast.success('已删除');
      loadPreferences();
    }
  };

  const getPreferenceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      allergy: '过敏源',
      dislike: '不喜欢',
      habit: '习惯',
      schedule: '日程',
    };
    return labels[type] || type;
  };

  const getPatternTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      food_reaction: '食物反应',
      time_pattern: '时间规律',
      activity_impact: '活动影响',
    };
    return labels[type] || type;
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return <Badge variant={variants[confidence] || 'outline'}>{labels[confidence] || confidence}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 xl:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl xl:text-3xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 xl:w-8 xl:h-8" />
          个人档案
        </h1>
        <p className="text-muted-foreground mt-2">
          管理您的健康档案、偏好设置和行为模式
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            基本档案
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Heart className="w-4 h-4 mr-2" />
            偏好设置
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Brain className="w-4 h-4 mr-2" />
            行为模式
          </TabsTrigger>
        </TabsList>

        {/* 基本档案 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>健康档案</CardTitle>
              <CardDescription>
                完善您的健康信息，帮助AI助手提供更精准的建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="diabetes-type">糖尿病类型</Label>
                  <Select value={diabetesType} onValueChange={(v) => setDiabetesType(v as DiabetesType)}>
                    <SelectTrigger id="diabetes-type">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="type1">1型糖尿病</SelectItem>
                      <SelectItem value="type2">2型糖尿病</SelectItem>
                      <SelectItem value="prediabetes">糖尿病前期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medication">当前用药</Label>
                  <Input
                    id="medication"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    placeholder="例如：二甲双胍、胰岛素"
                  />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target-min">目标血糖下限 (mmol/L)</Label>
                  <Input
                    id="target-min"
                    type="number"
                    step="0.1"
                    value={targetMin}
                    onChange={(e) => setTargetMin(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-max">目标血糖上限 (mmol/L)</Label>
                  <Input
                    id="target-max"
                    type="number"
                    step="0.1"
                    value={targetMax}
                    onChange={(e) => setTargetMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="health-notes">健康备注</Label>
                <Textarea
                  id="health-notes"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="其他重要的健康信息..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full xl:w-auto">
                {loading ? '保存中...' : '保存档案'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 偏好设置 */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>偏好与禁忌</CardTitle>
              <CardDescription>
                记录您的过敏源、饮食偏好、生活习惯等信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col xl:flex-row gap-2">
                <Select value={newPrefType} onValueChange={(v: any) => setNewPrefType(v)}>
                  <SelectTrigger className="w-full xl:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allergy">过敏源</SelectItem>
                    <SelectItem value="dislike">不喜欢</SelectItem>
                    <SelectItem value="habit">习惯</SelectItem>
                    <SelectItem value="schedule">日程</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newPrefContent}
                  onChange={(e) => setNewPrefContent(e.target.value)}
                  placeholder="输入具体内容..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddPreference();
                    }
                  }}
                />
                <Button onClick={handleAddPreference} className="w-full xl:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>

              <div className="space-y-2">
                {preferences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    暂无偏好设置，请添加
                  </p>
                ) : (
                  preferences.map((pref) => (
                    <div
                      key={pref.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline">{getPreferenceTypeLabel(pref.preference_type)}</Badge>
                        <span className="text-sm">{pref.content}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePreference(pref.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 行为模式 */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                行为模式洞察
              </CardTitle>
              <CardDescription>
                AI助手从您的历史数据中发现的规律和模式
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    暂无行为模式数据
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    继续使用智能对话功能，AI会自动分析并发现您的健康规律
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge>{getPatternTypeLabel(pattern.pattern_type)}</Badge>
                          {getConfidenceBadge(pattern.confidence)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          证据数: {pattern.evidence_count}
                        </span>
                      </div>
                      <p className="text-sm">{pattern.pattern_description}</p>
                      {pattern.last_observed_at && (
                        <p className="text-xs text-muted-foreground">
                          最后观察: {new Date(pattern.last_observed_at).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
