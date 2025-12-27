import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getBloodSugarRecords,
  getMealRecords,
  getExerciseRecords,
  createBloodSugarRecord,
  createMealRecord,
  createExerciseRecord,
  deleteBloodSugarRecord,
  deleteMealRecord,
  deleteExerciseRecord,
} from '@/db/api';
import type { BloodSugarRecord, MealRecord, ExerciseRecord, MeasurementType, MealType, ExerciseIntensity } from '@/types/types';
import { Plus, Trash2, Droplets, Utensils, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordsPage() {
  const [bloodSugarRecords, setBloodSugarRecords] = useState<BloodSugarRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    setLoading(true);
    const [bloodSugar, meals, exercises] = await Promise.all([
      getBloodSugarRecords(50),
      getMealRecords(50),
      getExerciseRecords(50),
    ]);
    setBloodSugarRecords(bloodSugar);
    setMealRecords(meals);
    setExerciseRecords(exercises);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">健康数据记录</h1>
        <p className="text-muted-foreground mt-2">
          记录和管理您的血糖、饮食、运动数据
        </p>
      </div>

      <Tabs defaultValue="blood-sugar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blood-sugar">
            <Droplets className="w-4 h-4 mr-2" />
            血糖记录
          </TabsTrigger>
          <TabsTrigger value="meals">
            <Utensils className="w-4 h-4 mr-2" />
            饮食记录
          </TabsTrigger>
          <TabsTrigger value="exercise">
            <Dumbbell className="w-4 h-4 mr-2" />
            运动记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blood-sugar">
          <BloodSugarTab
            records={bloodSugarRecords}
            loading={loading}
            onRefresh={loadAllRecords}
          />
        </TabsContent>

        <TabsContent value="meals">
          <MealTab
            records={mealRecords}
            loading={loading}
            onRefresh={loadAllRecords}
          />
        </TabsContent>

        <TabsContent value="exercise">
          <ExerciseTab
            records={exerciseRecords}
            loading={loading}
            onRefresh={loadAllRecords}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 血糖记录标签页
function BloodSugarTab({ records, loading, onRefresh }: { records: BloodSugarRecord[]; loading: boolean; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [type, setType] = useState<MeasurementType>('fasting');
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value) {
      toast.error('请输入血糖值');
      return;
    }

    setSubmitting(true);
    const result = await createBloodSugarRecord({
      value: parseFloat(value),
      measured_at: new Date(time).toISOString(),
      measurement_type: type,
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (result) {
      toast.success('血糖记录已添加');
      setOpen(false);
      setValue('');
      setNotes('');
      setTime(new Date().toISOString().slice(0, 16));
      onRefresh();
    } else {
      toast.error('添加失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    const success = await deleteBloodSugarRecord(id);
    if (success) {
      toast.success('记录已删除');
      onRefresh();
    } else {
      toast.error('删除失败');
    }
  };

  const getTypeLabel = (type: MeasurementType) => {
    const labels = {
      fasting: '空腹',
      before_meal: '餐前',
      after_meal: '餐后',
      bedtime: '睡前',
      random: '随机',
    };
    return labels[type];
  };

  const getValueColor = (value: number, type: MeasurementType) => {
    if (type === 'fasting') {
      if (value < 6.1) return 'text-chart-2';
      if (value < 7.0) return 'text-chart-3';
      return 'text-destructive';
    }
    if (value < 7.8) return 'text-chart-2';
    if (value < 11.1) return 'text-chart-3';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>血糖记录</CardTitle>
            <CardDescription>记录您的血糖测量数据</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加记录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加血糖记录</DialogTitle>
                <DialogDescription>记录您的血糖测量数据</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blood-sugar-value">血糖值 (mmol/L)</Label>
                  <Input
                    id="blood-sugar-value"
                    type="number"
                    step="0.1"
                    placeholder="例如：7.2"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measurement-type">测量类型</Label>
                  <Select value={type} onValueChange={(v) => setType(v as MeasurementType)}>
                    <SelectTrigger id="measurement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fasting">空腹</SelectItem>
                      <SelectItem value="before_meal">餐前</SelectItem>
                      <SelectItem value="after_meal">餐后</SelectItem>
                      <SelectItem value="bedtime">睡前</SelectItem>
                      <SelectItem value="random">随机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measurement-time">测量时间</Label>
                  <Input
                    id="measurement-time"
                    type="datetime-local"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood-sugar-notes">备注（可选）</Label>
                  <Textarea
                    id="blood-sugar-notes"
                    placeholder="记录相关情况..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? '添加中...' : '添加记录'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>测量时间</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>血糖值</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.measured_at).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(record.measurement_type)}</Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${getValueColor(record.value, record.measurement_type)}`}>
                    {record.value} mmol/L
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// 饮食记录标签页
function MealTab({ records, loading, onRefresh }: { records: MealRecord[]; loading: boolean; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [foodItems, setFoodItems] = useState('');
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!foodItems) {
      toast.error('请输入食物内容');
      return;
    }

    setSubmitting(true);
    const result = await createMealRecord({
      meal_type: mealType,
      food_items: foodItems,
      meal_time: new Date(time).toISOString(),
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (result) {
      toast.success('饮食记录已添加');
      setOpen(false);
      setFoodItems('');
      setNotes('');
      setTime(new Date().toISOString().slice(0, 16));
      onRefresh();
    } else {
      toast.error('添加失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    const success = await deleteMealRecord(id);
    if (success) {
      toast.success('记录已删除');
      onRefresh();
    } else {
      toast.error('删除失败');
    }
  };

  const getMealTypeLabel = (type: MealType) => {
    const labels = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return labels[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>饮食记录</CardTitle>
            <CardDescription>记录您的日常饮食</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加记录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加饮食记录</DialogTitle>
                <DialogDescription>记录您的饮食情况</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-type">餐次</Label>
                  <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                    <SelectTrigger id="meal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">早餐</SelectItem>
                      <SelectItem value="lunch">午餐</SelectItem>
                      <SelectItem value="dinner">晚餐</SelectItem>
                      <SelectItem value="snack">加餐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="food-items">食物内容</Label>
                  <Textarea
                    id="food-items"
                    placeholder="例如：牛肉面、苹果、酸奶"
                    value={foodItems}
                    onChange={(e) => setFoodItems(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-time">用餐时间</Label>
                  <Input
                    id="meal-time"
                    type="datetime-local"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-notes">备注（可选）</Label>
                  <Textarea
                    id="meal-notes"
                    placeholder="记录相关情况..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? '添加中...' : '添加记录'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用餐时间</TableHead>
                <TableHead>餐次</TableHead>
                <TableHead>食物内容</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.meal_time).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getMealTypeLabel(record.meal_type)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {record.food_items}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// 运动记录标签页
function ExerciseTab({ records, loading, onRefresh }: { records: ExerciseRecord[]; loading: boolean; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<ExerciseIntensity>('moderate');
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!exerciseType || !duration) {
      toast.error('请填写运动类型和时长');
      return;
    }

    setSubmitting(true);
    const result = await createExerciseRecord({
      exercise_type: exerciseType,
      duration_minutes: parseInt(duration),
      intensity,
      exercise_time: new Date(time).toISOString(),
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (result) {
      toast.success('运动记录已添加');
      setOpen(false);
      setExerciseType('');
      setDuration('');
      setNotes('');
      setTime(new Date().toISOString().slice(0, 16));
      onRefresh();
    } else {
      toast.error('添加失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    const success = await deleteExerciseRecord(id);
    if (success) {
      toast.success('记录已删除');
      onRefresh();
    } else {
      toast.error('删除失败');
    }
  };

  const getIntensityLabel = (intensity: ExerciseIntensity | null) => {
    if (!intensity) return '-';
    const labels = {
      light: '轻度',
      moderate: '中度',
      vigorous: '剧烈',
    };
    return labels[intensity];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>运动记录</CardTitle>
            <CardDescription>记录您的运动情况</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加记录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加运动记录</DialogTitle>
                <DialogDescription>记录您的运动情况</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-type">运动类型</Label>
                  <Input
                    id="exercise-type"
                    placeholder="例如：跑步、游泳、瑜伽"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">运动时长（分钟）</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="例如：30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intensity">运动强度</Label>
                  <Select value={intensity} onValueChange={(v) => setIntensity(v as ExerciseIntensity)}>
                    <SelectTrigger id="intensity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">轻度</SelectItem>
                      <SelectItem value="moderate">中度</SelectItem>
                      <SelectItem value="vigorous">剧烈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exercise-time">运动时间</Label>
                  <Input
                    id="exercise-time"
                    type="datetime-local"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exercise-notes">备注（可选）</Label>
                  <Textarea
                    id="exercise-notes"
                    placeholder="记录相关情况..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? '添加中...' : '添加记录'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>运动时间</TableHead>
                <TableHead>运动类型</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>强度</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.exercise_time).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>{record.exercise_type}</TableCell>
                  <TableCell>{record.duration_minutes} 分钟</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getIntensityLabel(record.intensity)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
