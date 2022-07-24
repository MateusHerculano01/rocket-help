import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HStack, VStack, useTheme, Text, ScrollView, Input, Box } from 'native-base';
import firestore from '@react-native-firebase/firestore';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import { CircleWavyCheck, Hourglass, DesktopTower, ClipboardText } from 'phosphor-react-native'

import { dateFormat } from '../Utils/firestoreDateFormat';

import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { CardDetails } from '../components/CardDetails';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';


type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();

  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);

  const { orderId } = route.params as RouteParams;

  function handleOrderClose() {
    if (!solution) {
      return Alert.alert('Solicitação', 'Informe a solução para encerrar a solicitação.');
    }

    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .update({
        status: 'closed',
        solution,
        closed_at: firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        Alert.alert('Solicitação', 'Solicitação encerrada.');
        navigation.goBack();
      })
      .catch(err => {
        console.log(err);
        Alert.alert('Solicitação', 'Não foi possível encerrar a solicitação.');
      });
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

        const closed = closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed
        });

        setIsLoading(false);

      });

  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg="gray.600">
        <Header title="Solicitação" />
      </Box>

      <HStack bg="gray.500" justifyContent="center" p={4}>
        {
          order.status === 'closed'
            ? <CircleWavyCheck size={22} color={colors.green[300]} />
            : <Hourglass size={22} color={colors.secondary[700]} />
        }

        <Text
          fontSize="sm"
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform="uppercase"
        >
          {order.status == 'closed' ? 'Finalizado' : 'Em andamento'}
        </Text>
      </HStack>

      <ScrollView
        mx={5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 24
        }}
      >
        <CardDetails
          title="equipamento"
          description={`Patrimômio ${order.patrimony}`}
          icon={DesktopTower}
        />
        <CardDetails
          title="descrição do problema"
          description={order.description}
          icon={ClipboardText}
          footer={`Registrado em ${order.when}`}
        />
        <CardDetails
          title="solução"
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          {
            order.status === 'open' &&
            <Input
              h={32}
              bg="gray.700"
              color="lightText"
              placeholder='Descrição da solução'
              onChangeText={setSolution}
              textAlignVertical="top"
              multiline
            />
          }
        </CardDetails>
      </ScrollView>

      {
        order.status === 'open' &&
        <Button
          title='Encerrar solicitação'
          onPress={handleOrderClose}
          isLoading={isUpdateLoading}
          m={5}
        />
      }
    </VStack>
  );
}